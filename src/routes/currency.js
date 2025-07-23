const express = require('express');
const router = express.Router();

// Mock users data
const users = [
    { id: '1', name: 'Alice', email: 'alice@example.com', createdAt: new Date().toISOString() },
    { id: '2', name: 'Bob', email: 'bob@example.com', createdAt: new Date().toISOString() },
    // Add more users as needed
];

// GET /users?limit=10
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    res.json(users.slice(0, limit));
});

module.exports = router;
