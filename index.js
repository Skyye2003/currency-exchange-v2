import express from 'express';
import { checkDatabaseHealth } from './src/db/config.js';

const app = express();
const PORT = 3000;

// 前置中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 启动前数据库健康检查
const initializeServer = async () => {
  try {
    // 检查数据库连接
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection established');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// 路由配置
import currencyRouter from './src/routes/currency.js';
import userRouter from './src/routes/user.js'
app.use('/api', currencyRouter);
app.use('/api', userRouter)

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('⚠️ Server error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动应用
initializeServer();

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(async () => {
    await pool.end();
    console.log('🔌 Database connections closed');
    process.exit(0);
  });
});