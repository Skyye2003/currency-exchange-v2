// src/routes/currency.js

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

const path='/currency';

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

module.exports = router;