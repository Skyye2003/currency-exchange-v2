import mysql from 'mysql2/promise';

// 数据库配置（使用环境变量 + 默认值）
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'n3u3da!', // 请替换为实际密码
  database: 'currency_exchange',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // 使用UTC时间
  charset: 'utf8mb4_unicode_ci'
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 连接生命周期事件处理
pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('acquire', (connection) => {
  console.debug('Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.debug('Connection %d released', connection.threadId);
});

// 统一查询方法
export const query = async (sql, values) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(sql, values);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  } finally {
    if (connection) connection.release();
  }
};



// 事务处理封装
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 健康检查
export const checkDatabaseHealth = async () => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// 关闭连接池（用于优雅退出）
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing connection pool:', error);
    process.exit(1);
  }
});
