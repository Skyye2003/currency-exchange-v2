import express from 'express';
import { query, transaction } from '../db/config.js';

// * 创建路由实例
const router = express.Router();

// * base路由
const path = '/currency';

// PUT: 更新货币信息（通过 id）
router.put(`${path}/:id`, async (req, res) => {
  const { id } = req.params;
  const { name, symbol, exchange_rate } = req.body;

  // 校验输入
  if (!name && !symbol && exchange_rate === undefined) {
    return res.status(400).json({ error: '至少提供 name、symbol 或 exchange_rate 中的一个字段' });
  }

  try {
    // ✅ 正确查询：使用 id
    const existingCurrencies = await query('SELECT id FROM currencies WHERE id = ?', [id]);
    if (existingCurrencies.length === 0) {
      return res.status(404).json({ error: '货币不存在' });
    }

    // 构建动态更新 SQL
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (symbol !== undefined) {
      fields.push('symbol = ?');
      values.push(symbol);
    }
    if (exchange_rate !== undefined) {
      const rate = parseFloat(exchange_rate);
      if (isNaN(rate) || rate <= 0) {
        return res.status(400).json({ error: 'exchange_rate 必须是正数' });
      }
      fields.push('exchange_rate = ?');
      values.push(rate);
    }

    values.push(id); // ✅ 正确绑定 WHERE id = ?

    const sql = `UPDATE currencies SET ${fields.join(', ')}, last_updated = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, values);

    res.json({ message: '货币信息更新成功', id });
  } catch (err) {
    console.error('更新货币出错:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /currencies
router.get(`${path}`, async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, code, name, symbol FROM currencies'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// * 删除货币记录
router.delete(`${path}/:id`, async (req, res) => {
  try {
    const currencyId = req.params.id;

    // 验证ID格式（UUIDv4格式）
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(currencyId)) {
      return res.status(400).json({ error: 'Invalid currency ID format' });
    }

    // 使用事务保证数据一致性
    const result = await transaction(async (connection) => {
      // 检查货币是否存在
      const [existing] = await connection.query(
        'SELECT * FROM currencies WHERE id = ? FOR UPDATE',
        [currencyId]
      );

      if (existing.length === 0) {
        return { affectedRows: 0 };
      }

      // 执行删除
      const deleteResult = await connection.query(
        'DELETE FROM currencies WHERE id = ?',
        [currencyId]
      );

      return deleteResult;
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    res.status(200).json({ 
      message: 'Currency deleted successfully',
      deletedId: currencyId
    });

  } catch (error) {
    console.error('Delete currency error:', error);
    res.status(500).json({ 
      error: 'Failed to delete currency',
      details: error.message
    });
  }
});


router.post(`${path}`, async (req, res) => {
    const {
        code, 
        name,
        symbol,
        exchange_rate
    } = req.body

    if (!code || !name || !symbol || !exchange_rate) {
        return res.status(400).json({
            error: 'Missing required fields'
        })
    }

    const sql = `
        INSERT INTO currencies (code, name, symbol, exchange_rate, last_updated)
        VALUES (?, ?, ?, ?, NOW())
    `

    try {
        await query(sql, [code, name, symbol, exchange_rate])
        res.status(201).json({
            message: 'Currency created successfully',
        })
    } catch (e) {        
        console.error(e)
        return res.status(500).json({
            error: 'Database error'
        })
    }
})





// * 搜索货币记录
router.get(`${path}/search`, async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required for search' });
    }

    console.log('Received keyword:', keyword);
    console.log('Executing query:', `SELECT * FROM currencies WHERE code LIKE ? OR name LIKE ?`, [`%${keyword}%`, `%${keyword}%`]);
    // 查询匹配的货币记录 (case-insensitive search)
    const results = await query(
      `SELECT * FROM currencies WHERE LOWER(code) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)`,
      [`%${keyword}%`, `%${keyword}%`]
    );

    console.log('Query results:', results);

    res.status(200).json({
      message: 'Search results',
      data: results,
    });
  } catch (error) {
    console.error('Search currencies error:', error);
    res.status(500).json({
      error: 'Failed to search currencies',
      details: error.message,
    });
  }
});


// 导出路由
export default router;
