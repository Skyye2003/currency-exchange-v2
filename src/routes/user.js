// routes/user.js

const express = require('express');
const router = express.Router();
const db = require('../db/index'); // 假设你的数据库连接在这里

// PUT: 更新用户信息（不包括密码）
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, balance } = req.body;

  // 校验输入
  if (!name && !email && balance === undefined) {
    return res.status(400).json({ error: '至少提供 name、email 或 balance 中的一个字段' });
  }

  try {
    const connection = await db.getConnection();

    // 检查用户是否存在
    const [existingUsers] = await connection.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      connection.release();
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
      const [emailCheck] = await connection.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        connection.release();
        return res.status(409).json({ error: '该邮箱已被其他用户使用' });
      }
      fields.push('email = ?');
      values.push(email);
    }
    if (balance !== undefined) {
      fields.push('balance = ?');
      values.push(parseFloat(balance).toFixed(2));
    }

    values.push(id); // 最后一个 ? 是 WHERE id = ?

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await connection.execute(query, values);

    connection.release();

    res.json({ message: '用户信息更新成功', userId: id });
  } catch (err) {
    console.error('更新用户出错:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;