const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;


// 中间件配置
app.use(express.json());

// Mock data for users and currencies
const users = [
    { id: '1', name: 'Alice', email: 'alice@example.com', createdAt: new Date().toISOString() },
    { id: '2', name: 'Bob', email: 'bob@example.com', createdAt: new Date().toISOString() },
    // 可根据需要添加更多用户
];

const currencies = [
    { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$' },
    { id: 'cny', code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    // 可根据需要添加更多货币
];

// 路由定义
app.get('/', (req, res) => {
    res.send('Currency Exchange Service - Express Edition');
});

app.get('/rates', (req, res) => {
    // 后续可替换为真实数据
    res.json({
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        lastUpdated: new Date().toISOString()
    });
});

// GET /users?limit=10
app.get('/users', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    res.json(users.slice(0, limit));
});

// GET /currencies
app.get('/currencies', (req, res) => {
    res.json(currencies);
});

// 处理404
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT} ${new Date().toISOString()}`);
});
