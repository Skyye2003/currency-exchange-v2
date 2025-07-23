// routes/currency.js

const express = require('express');
const router = express.Router();
const db = require('../db/index');

// PUT: 更新货币信息（通过 code）
router.put('/:code', async (req, res) => {
  const { code } = req.params;
  const { name, symbol, exchange_rate } = req.body;

  // 校验输入
  if (!name && !symbol && exchange_rate === undefined) {
    return res.status(400).json({ error: '至少提供 name、symbol 或 exchange_rate 中的一个字段' });
  }

  try {
    const connection = await db.getConnection();

    // 检查货币是否存在
    const [existingCurrencies] = await connection.execute('SELECT id FROM currencies WHERE code = ?', [code]);
    if (existingCurrencies.length === 0) {
      connection.release();
      return res.status(404).json({ error: '货币代码不存在' });
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

    values.push(code); // WHERE code = ?

    const query = `UPDATE currencies SET ${fields.join(', ')}, last_updated = CURRENT_TIMESTAMP WHERE code = ?`;
    await connection.execute(query, values);

    connection.release();

    res.json({ message: '货币信息更新成功', code });
  } catch (err) {
    console.error('更新货币出错:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;