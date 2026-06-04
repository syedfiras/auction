import express from 'express';
import { supabase, must } from '../config/db.js';

const router = express.Router();

router.get('/active', async (req, res) => {
  const tournament = await must(await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle());
  if (!tournament) return res.status(404).json({ error: 'No active tournament' });
  res.json(tournament);
});

export default router;
