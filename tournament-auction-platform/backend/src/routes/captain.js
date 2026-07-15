import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabase, must } from '../config/db.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['captain']));

router.get('/my-team', async (req, res) => {
  const team = await must(await supabase
    .from('teams')
    .select('*, tournaments(name, squad_limit, points_per_team)')
    .eq('captain_id', req.user.id)
    .maybeSingle());
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json({ ...team, tournament_name: team.tournaments?.name });
});

router.get('/squad', async (req, res) => {
  const team = await must(await supabase
    .from('teams')
    .select('id')
    .eq('captain_id', req.user.id)
    .maybeSingle());
  if (!team) return res.status(404).json({ error: 'Team not found' });
  const players = await must(await supabase
    .from('players')
    .select('*')
    .eq('sold_to_team', team.id)
    .eq('status', 'sold'));
  res.json(players);
});

export default router;
