import express from 'express';
import { query, transaction } from '../db/config.js';

// * 创建路由实例
const router = express.Router();

// * base路由
const path = '/currency';

// GET /currencies
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
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

// 导出路由
export default router;
