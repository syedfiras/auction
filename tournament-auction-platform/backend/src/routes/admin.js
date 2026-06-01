import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['admin']));

// Create tournament
router.post('/tournaments', async (req, res) => {
  const { name, location, date, points_per_team, squad_limit, timer_seconds } = req.body;
  const [result] = await pool.query(
    `INSERT INTO tournaments (name, location, date, points_per_team, squad_limit, timer_seconds, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [name, location, date, points_per_team, squad_limit, timer_seconds, req.user.id]
  );
  const [newTournament] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [result.insertId]);
  res.json(newTournament[0]);
});

// Get pending players
router.get('/players/pending', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, u.full_name as registered_by_name
     FROM players p
     LEFT JOIN users u ON p.registered_by = u.id
     WHERE p.status = 'pending'`
  );
  res.json(rows);
});

// Approve player
router.put('/players/:id/approve', async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE players SET status = "approved", approved_by = ? WHERE id = ?', [req.user.id, id]);
  const [updated] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
  const player = updated[0];
  req.app.get('io')?.emit('playerApproved', player);
  res.json(player);
});

// Reject player
router.put('/players/:id/reject', async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE players SET status = "rejected" WHERE id = ?', [id]);
  const [updated] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
  const player = updated[0];
  req.app.get('io')?.emit('playerRejected', player);
  res.json(player);
});

// Latest tournament (draft or active) for admin setup
router.get('/tournaments/current', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM tournaments
     WHERE status IN ('draft', 'active')
     ORDER BY FIELD(status, 'active', 'draft'), created_at DESC
     LIMIT 1`
  );
  if (rows.length === 0) return res.json(null);
  res.json(rows[0]);
});

// Activate tournament (only one active at a time)
router.put('/tournaments/:id/activate', async (req, res) => {
  const { id } = req.params;
  await pool.query("UPDATE tournaments SET status = 'completed' WHERE status = 'active'");
  await pool.query("UPDATE tournaments SET status = 'active' WHERE id = ?", [id]);
  const [updated] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [id]);
  if (updated.length === 0) return res.status(404).json({ error: 'Tournament not found' });
  res.json(updated[0]);
});

// List captains (users with captain role, not yet assigned to a team in this tournament)
router.get('/captains', async (req, res) => {
  const { tournamentId } = req.query;
  let query = `SELECT u.id, u.full_name, u.email FROM users u WHERE u.role = 'captain'`;
  const params = [];
  if (tournamentId) {
    query += ` AND u.id NOT IN (SELECT captain_id FROM teams WHERE tournament_id = ? AND captain_id IS NOT NULL)`;
    params.push(tournamentId);
  }
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

// List teams for a tournament
router.get('/teams', async (req, res) => {
  const { tournamentId } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId is required' });
  const [rows] = await pool.query(
    `SELECT t.*, u.full_name AS captain_name
     FROM teams t
     LEFT JOIN users u ON t.captain_id = u.id
     WHERE t.tournament_id = ?
     ORDER BY t.name`,
    [tournamentId]
  );
  res.json(rows);
});

// Create team
router.post('/teams', async (req, res) => {
  const { name, tournament_id, captain_id } = req.body;
  const [tournamentRows] = await pool.query('SELECT points_per_team FROM tournaments WHERE id = ?', [tournament_id]);
  const points = tournamentRows[0]?.points_per_team || 1000;
  const [result] = await pool.query(
    `INSERT INTO teams (name, tournament_id, captain_id, remaining_points) VALUES (?, ?, ?, ?)`,
    [name, tournament_id, captain_id, points]
  );
  const [newTeam] = await pool.query('SELECT * FROM teams WHERE id = ?', [result.insertId]);
  res.json(newTeam[0]);
});

export default router;