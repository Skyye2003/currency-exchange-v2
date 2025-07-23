const express = require('express');
const app = express();
const PORT = 3000;


// 中间件配置
app.use(express.json());

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

// 处理404
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT} ${new Date().toISOString()}`);
});
