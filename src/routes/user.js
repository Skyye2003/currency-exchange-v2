import express from 'express';
import { query, transaction } from '../db/config.js';

// * 创建路由实例
const router = express.Router();

// * base路由
const path = '/user';

router.delete(`${path}/:id`, async (req, res) => {
    try {
        const userId = req.params.id;

        // 验证ID格式（UUIDv4格式）
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // 使用事务保证数据一致性
        const result = await transaction(async (connection) => {
            // 检查用户是否存在
            const [existing] = await connection.query(
                'SELECT * FROM users WHERE id = ? FOR UPDATE',
                [userId]
            );

            if (existing.length === 0) {
                return { affectedRows: 0 };
            }

            // 执行删除
            const deleteResult = await connection.query(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            return deleteResult;
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});