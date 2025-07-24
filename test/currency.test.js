import request from 'supertest';
import app from '../index.js'; // 你的Express app实例
import { query } from '../src/db/config.js';

describe('DELETE /api/currencies/:id', () => {
  let testCurrencyId;

  beforeAll(async () => {
    // 创建测试数据
    const [result] = await query(
      `INSERT INTO currencies (id, code, name, symbol, exchange_rate)
      VALUES (UUID(), 'TST', 'Test Currency', 'T', 1.000000)`
    );
    testCurrencyId = result.insertId;
  });

  it('should delete currency with valid ID', async () => {
    const res = await request(app)
      .delete(`/api/currencies/${testCurrencyId}`)
      .expect(200);

    expect(res.body).toHaveProperty('deletedId', testCurrencyId);
  });

  it('should return 400 for invalid UUID', async () => {
    const res = await request(app)
      .delete('/api/currencies/123')
      .expect(400);

    expect(res.body).toHaveProperty('error', 'Invalid currency ID format');
  });

  afterAll(async () => {
    // 清理测试数据
    await query('DELETE FROM currency_deletion_logs');
  });
}); 