const express = require('express');
const router = express.Router();
const db = require('../db');

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

module.exports = router;