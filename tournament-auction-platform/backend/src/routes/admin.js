import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabase, must } from '../config/db.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['admin']));

async function profilesById(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const profiles = await must(await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .in('id', uniqueIds));
  return new Map(profiles.map(profile => [profile.id, profile]));
}

async function teamsById(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const teams = await must(await supabase
    .from('teams')
    .select('id, name')
    .in('id', uniqueIds));
  return new Map(teams.map(team => [team.id, team]));
}

router.post('/tournaments', async (req, res) => {
  const { name, location, date, points_per_team, squad_limit, timer_seconds } = req.body;
  const existing = await must(await supabase
    .from('tournaments')
    .select('id, name, status')
    .in('status', ['draft', 'active'])
    .limit(1));
  if (existing.length > 0) {
    return res.status(400).json({
      error: `"${existing[0].name}" is already ${existing[0].status}. Complete or clean it up first.`
    });
  }

  const tournament = await must(await supabase
    .from('tournaments')
    .insert({
      name,
      location,
      date,
      points_per_team,
      squad_limit,
      timer_seconds,
      status: 'draft',
      created_by: req.user.id,
    })
    .select('*')
    .single());
  res.json(tournament);
});

router.get('/players/pending', async (req, res) => {
  const { tournamentId } = req.query;
  let query = supabase.from('players').select('*').eq('status', 'pending');
  if (tournamentId) query = query.eq('tournament_id', tournamentId);
  const players = await must(await query.order('created_at', { ascending: false }));
  const profileMap = await profilesById(players.map(player => player.registered_by));
  res.json(players.map(player => ({
    ...player,
    registered_by_name: profileMap.get(player.registered_by)?.full_name || null,
  })));
});

router.put('/players/:id/approve', async (req, res) => {
  const { id } = req.params;
  const player = await must(await supabase
    .from('players')
    .update({ status: 'approved', approved_by: req.user.id })
    .eq('id', id)
    .select('*')
    .single());
  req.app.get('io')?.emit('playerApproved', player);
  res.json(player);
});

router.put('/players/:id/reject', async (req, res) => {
  const { id } = req.params;
  const player = await must(await supabase
    .from('players')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select('*')
    .single());
  req.app.get('io')?.emit('playerRejected', player);
  res.json(player);
});

router.get('/tournaments/current', async (req, res) => {
  const rows = await must(await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false }));
  const statusRank = { active: 0, draft: 1, completed: 2 };
  rows.sort((a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9));
  res.json(rows[0] || null);
});

router.put('/tournaments/:id/activate', async (req, res) => {
  const { id } = req.params;
  await must(await supabase.from('tournaments').update({ status: 'completed' }).eq('status', 'active'));
  const tournament = await must(await supabase
    .from('tournaments')
    .update({ status: 'active' })
    .eq('id', id)
    .select('*')
    .maybeSingle());
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  res.json(tournament);
});

router.get('/captains', async (req, res) => {
  const { tournamentId } = req.query;
  if (!tournamentId) return res.json([]);

  const assignedTeams = await must(await supabase
    .from('teams')
    .select('captain_id')
    .eq('tournament_id', tournamentId)
    .not('captain_id', 'is', null));
  const assigned = new Set(assignedTeams.map(team => team.captain_id));

  const registeredPlayers = await must(await supabase
    .from('players')
    .select('registered_by')
    .eq('tournament_id', tournamentId)
    .not('status', 'in', '("rejected","captain")')
    .not('registered_by', 'is', null));
  const profileIds = [...new Set(registeredPlayers.map(player => player.registered_by))]
    .filter(id => !assigned.has(id));
  if (profileIds.length === 0) return res.json([]);

  const profiles = await must(await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', profileIds)
    .in('role', ['player', 'captain'])
    .order('full_name'));
  res.json(profiles);
});

router.get('/teams', async (req, res) => {
  const { tournamentId } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId is required' });
  const teams = await must(await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('name'));
  const profileMap = await profilesById(teams.map(team => team.captain_id));
  res.json(teams.map(team => ({
    ...team,
    captain_name: profileMap.get(team.captain_id)?.full_name || null,
  })));
});

router.post('/teams', async (req, res) => {
  const { name, tournament_id, captain_id } = req.body;
  const tournament = await must(await supabase
    .from('tournaments')
    .select('points_per_team')
    .eq('id', tournament_id)
    .maybeSingle());
  const points = tournament?.points_per_team || 1000;
  const team = await must(await supabase
    .from('teams')
    .insert({ name, tournament_id, captain_id, remaining_points: points })
    .select('*')
    .single());
  if (captain_id) {
    await must(await supabase.from('profiles').update({ role: 'captain' }).eq('id', captain_id));
    await must(await supabase
      .from('players')
      .update({ status: 'captain' })
      .eq('registered_by', captain_id)
      .eq('tournament_id', tournament_id));
  }
  res.json(team);
});

router.get('/players/all', async (req, res) => {
  const { tournamentId } = req.query;
  let query = supabase.from('players').select('*');
  if (tournamentId) query = query.eq('tournament_id', tournamentId);
  const players = await must(await query.order('created_at', { ascending: false }));
  const profileMap = await profilesById(players.map(player => player.registered_by));
  const teamMap = await teamsById(players.map(player => player.sold_to_team));
  res.json(players.map(player => ({
    ...player,
    registered_by_name: profileMap.get(player.registered_by)?.full_name || null,
    team_name: teamMap.get(player.sold_to_team)?.name || null,
  })));
});

router.delete('/players/:id', async (req, res) => {
  const { id } = req.params;
  const auctions = await must(await supabase.from('auctions').select('id').eq('player_id', id));
  const auctionIds = auctions.map(auction => auction.id);
  if (auctionIds.length > 0) await must(await supabase.from('bids').delete().in('auction_id', auctionIds));
  await must(await supabase.from('auctions').delete().eq('player_id', id));
  await must(await supabase.from('players').delete().eq('id', id));
  res.json({ message: 'Player deleted' });
});

router.get('/users/captains', async (req, res) => {
  const { tournamentId } = req.query;
  const profiles = await must(await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at')
    .eq('role', 'captain')
    .order('full_name'));
  let teams = [];
  if (profiles.length > 0) {
    let teamQuery = supabase.from('teams').select('id, name, captain_id');
    if (tournamentId) teamQuery = teamQuery.eq('tournament_id', tournamentId);
    teams = await must(await teamQuery.in('captain_id', profiles.map(profile => profile.id)));
  }
  const teamMap = new Map(teams.map(team => [team.captain_id, team]));
  res.json(profiles.map(profile => ({
    ...profile,
    team_id: teamMap.get(profile.id)?.id || null,
    team_name: teamMap.get(profile.id)?.name || null,
  })));
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  await must(await supabase.from('teams').update({ captain_id: null }).eq('captain_id', id));
  await must(await supabase.from('notifications').delete().eq('user_id', id));
  await must(await supabase.from('profiles').delete().eq('id', id).in('role', ['captain', 'player']));
  res.json({ message: 'User deleted' });
});

router.delete('/tournaments/:id/cleanup', async (req, res) => {
  const { id } = req.params;
  const auctions = await must(await supabase.from('auctions').select('id').eq('tournament_id', id));
  const auctionIds = auctions.map(auction => auction.id);
  if (auctionIds.length > 0) await must(await supabase.from('bids').delete().in('auction_id', auctionIds));
  await must(await supabase.from('auctions').delete().eq('tournament_id', id));
  await must(await supabase.from('players').delete().eq('tournament_id', id));
  await must(await supabase.from('teams').delete().eq('tournament_id', id));
  await must(await supabase.from('tournaments').delete().eq('id', id));

  const nonAdminProfiles = await must(await supabase
    .from('profiles')
    .select('id')
    .neq('role', 'admin'));
  const profileIds = nonAdminProfiles.map(profile => profile.id);
  if (profileIds.length > 0) {
    await must(await supabase.from('notifications').delete().in('user_id', profileIds));
    await must(await supabase.from('profiles').delete().in('id', profileIds));
  }

  res.json({ message: 'Tournament data and all non-admin profiles wiped clean.' });
});

export default router;
