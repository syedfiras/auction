import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/active', async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM tournaments WHERE status = 'active' LIMIT 1");
  if (rows.length === 0) return res.status(404).json({ error: 'No active tournament' });
  res.json(rows[0]);
});

export default router;