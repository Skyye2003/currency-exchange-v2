import express from 'express';
import { query, transaction } from '../db/config.js';

// * 创建路由实例
const router = express.Router();

// * base路由
const path = '/user';
// PUT: 更新用户信息（不包括密码）
router.put(`${path}/:id`, async (req, res) => {
  const { id } = req.params;
  const { name, email, balance } = req.body;

  // 校验输入
  if (!name && !email && balance === undefined) {
    return res.status(400).json({ error: '至少提供 name、email 或 balance 中的一个字段' });
  }

  try {
    // 检查用户是否存在
    const existingUsers = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 构建动态更新 SQL
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      // 检查 email 是否已被其他用户使用
      const emailCheck = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(409).json({ error: '该邮箱已被其他用户使用' });
      }
      fields.push('email = ?');
      values.push(email);
    }
    if (balance !== undefined) {
      fields.push('balance = ?');
      values.push(parseFloat(balance).toFixed(2));
    }

    values.push(id); // WHERE id = ?

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);

    res.json({ message: '用户信息更新成功', userId: id });
  } catch (err) {
    console.error('更新用户出错:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get(`${path}`, async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    try {
      const [rows] = await query(
        'SELECT id, name, email, created_at AS createdAt FROM users LIMIT ?',
        [limit]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

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

router.post(`${path}`, async (req, res) => {
    const {
        name,
        email,
        password_hash,
        balance
    } = req.body

    if (!name || !email || !password_hash || balance === undefined) {
        return res.status(400).json({
            error: 'Missing required fields'
        })
    }

    const sql = `
        INSERT INTO users (name, email, password_hash, balance, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
    `

    try {
        await query(sql, [name, email, password_hash, balance])
        res.status(201).json({
            message: 'User created successfully',
        })
    } catch (e) {        
        console.error(e)
        return res.status(500).json({
            error: 'Database error'
        })
    }
})

export default router
