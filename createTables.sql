-- 创建数据库
CREATE DATABASE IF NOT EXISTS currency_exchange;
USE currency_exchange;

-- 用户表（对应User schema）
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()), -- 使用UUID代替自增ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash CHAR(60) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 货币表（对应Currency schema）
CREATE TABLE IF NOT EXISTS currencies (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()), -- 使用UUID
    code CHAR(3) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL, -- 新增symbol字段
    exchange_rate DECIMAL(15,6) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入初始货币数据（补充symbol字段）
INSERT INTO currencies (code, name, symbol, exchange_rate) VALUES
('USD', 'US Dollar', '$', 1.000000),
('EUR', 'Euro', '€', 0.920000),
('GBP', 'British Pound', '£', 0.790000),
('JPY', 'Japanese Yen', '¥', 144.500000),
('CNY', 'Chinese Yuan', '¥', 7.200000);

