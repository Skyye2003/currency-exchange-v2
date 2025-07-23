const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /users?limit=10
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, created_at AS createdAt FROM users LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
