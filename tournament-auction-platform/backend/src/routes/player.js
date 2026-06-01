import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['player']));

router.post('/register', async (req, res) => {
  const { full_name, age, phone, position, preferred_foot, experience, photo_url, skill_rating, tournament_id } = req.body;
  const [result] = await pool.query(
    `INSERT INTO players
     (full_name, age, phone, position, preferred_foot, experience, photo_url, skill_rating, tournament_id, registered_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [full_name, age, phone, position, preferred_foot, experience, photo_url, skill_rating, tournament_id, req.user.id]
  );
  const [newPlayer] = await pool.query('SELECT * FROM players WHERE id = ?', [result.insertId]);
  res.json(newPlayer[0]);
});

router.get('/my-registration', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, t.name AS team_name
     FROM players p
     LEFT JOIN teams t ON p.sold_to_team = t.id
     WHERE p.registered_by = ?
     ORDER BY p.created_at DESC
     LIMIT 1`,
    [req.user.id]
  );
  res.json(rows[0] || null);
});

export default router;