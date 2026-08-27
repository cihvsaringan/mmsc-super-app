import { Router } from 'express';
import { pool } from '../database/pool.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mmsc-api', version: '0.3.0' });
});

healthRouter.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not_ready', database: 'unavailable' });
  }
});
