import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['captain']));

router.get('/my-team', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT t.*, tour.name as tournament_name
     FROM teams t
     JOIN tournaments tour ON t.tournament_id = tour.id
     WHERE t.captain_id = ?`,
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Team not found' });
  res.json(rows[0]);
});

router.get('/squad', async (req, res) => {
  const [teamRows] = await pool.query('SELECT id FROM teams WHERE captain_id = ?', [req.user.id]);
  if (teamRows.length === 0) return res.status(404).json({ error: 'Team not found' });
  const teamId = teamRows[0].id;
  const [players] = await pool.query('SELECT * FROM players WHERE sold_to_team = ? AND status = "sold"', [teamId]);
  res.json(players);
});

export default router;