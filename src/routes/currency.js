import express from 'express';
import { query, transaction } from '../db/config.js';

// * 创建路由实例
const router = express.Router();

// * base路由
const path = '/currency';

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
