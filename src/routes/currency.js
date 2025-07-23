import express from 'express';
import { query, transaction } from '../db/config.js';

const router = express.Router();

// 删除货币记录
router.delete('/:id', async (req, res) => {
  try {
    const currencyId = req.params.id;

    // 验证ID格式（UUIDv4格式）
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(currencyId)) {
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

      // 记录审计日志（示例）
      await connection.query(
        `INSERT INTO currency_deletion_logs 
        (currency_id, code, name, deleted_at) 
        VALUES (?, ?, ?, NOW())`,
        [currencyId, existing[0].code, existing[0].name]
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

// 导出路由
export default router;
