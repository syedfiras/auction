import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';

const STATUS_BADGE = {
  draft: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  active: 'bg-green-500/15 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const playerPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="90" fill="%23333" stroke="%2300cccc" stroke-width="6"/%3E%3Ctext x="100" y="115" text-anchor="middle" fill="%2300cccc" font-size="60"%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E';

function StatCard({ label, value, color, icon, accent }) {
  return (
    <div className={`p-4 bg-slate-900/70 rounded-xl border border-white/5 hover:border-cyan-500/30 transition group relative overflow-hidden`}>
      <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition ${accent || 'bg-cyan-500'}`} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${accent || 'bg-cyan-400'}`} />
      </div>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
    </div>
  );
}

export default function OverviewStats({ tournament }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const tournamentId = tournament?.id;

  const fetchStats = useCallback(async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    try {
      const [allPlayers, allTeams] = await Promise.all([
        api.getAllPlayers(tournamentId),
        api.getTeams(tournamentId),
      ]);
      setPlayers(allPlayers);
      setTeams(allTeams);
    } catch (err) {
      console.error('Failed to load overview stats', err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchStats();

    const socket = initSocket();
    if (socket) {
      const handleUpdate = () => fetchStats();
      socket.on('playerApproved', handleUpdate);
      socket.on('playerRegistered', handleUpdate);
      socket.on('playerSold', handleUpdate);
      socket.on('playerUnsold', handleUpdate);
      socket.on('pointsUpdated', handleUpdate);

      return () => {
        socket.off('playerApproved', handleUpdate);
        socket.off('playerRegistered', handleUpdate);
        socket.off('playerSold', handleUpdate);
        socket.off('playerUnsold', handleUpdate);
        socket.off('pointsUpdated', handleUpdate);
      };
    }
  }, [fetchStats]);

  if (!tournament) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/70 backdrop-blur-xl p-8 rounded-2xl border border-cyan-500/20 text-center"
      >
        <div className="text-4xl mb-3">&#127944;</div>
        <h3 className="text-xl font-bold">No tournament yet</h3>
        <p className="text-slate-400 text-sm mt-1">
          Head over to <span className="text-cyan-400 font-medium">Tournament Setup</span> to create and activate one.
        </p>
      </motion.div>
    );
  }

  const total = players.length;
  const pending = players.filter(p => p.status === 'pending').length;
  const approved = players.filter(p => p.status === 'approved').length;
  const unsold = players.filter(p => p.status === 'unsold').length;
  const sold = players.filter(p => p.status === 'sold').length;

  const totalPointsPool = teams.length * (tournament.points_per_team || 1000);
  const remainingPointsPool = teams.reduce((acc, t) => acc + (t.remaining_points || 0), 0);
  const spentPointsPool = totalPointsPool - remainingPointsPool;
  const spentPercentage = totalPointsPool > 0 ? (spentPointsPool / totalPointsPool) * 100 : 0;

  const recentSales = players
    .filter(p => p.status === 'sold')
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Tournament summary */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#127944;</span>
            <div>
              <h2 className="text-xl font-bold">Tournament Summary</h2>
              <p className="text-slate-400 text-sm">{tournament.name}</p>
            </div>
          </div>
          <span className={`self-start md:self-auto text-xs px-3 py-1 rounded-full border font-medium uppercase tracking-wider ${STATUS_BADGE[tournament.status] || 'text-slate-400'}`}>
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Location</p>
            <p className="text-sm font-semibold mt-1 truncate">{tournament.location || 'Not set'}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Date</p>
            <p className="text-sm font-semibold mt-1">{tournament.date || 'Not set'}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Points / Team</p>
            <p className="text-sm font-bold text-cyan-400 mt-1">{tournament.points_per_team}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Squad Limit</p>
            <p className="text-sm font-bold text-purple-400 mt-1">{tournament.squad_limit}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="bg-slate-900/70 rounded-2xl border border-white/5 p-8 text-center text-slate-400">Loading stats...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon="&#128101;" label="Total Players" value={total} color="text-white" accent="bg-cyan-500" />
            <StatCard icon="&#9203;" label="Pending" value={pending} color="text-yellow-400" accent="bg-yellow-500" />
            <StatCard icon="&#9989;" label="Approved (R1)" value={approved} color="text-green-400" accent="bg-green-500" />
            <StatCard icon="&#128176;" label="Sold" value={sold} color="text-cyan-400" accent="bg-cyan-500" />
            <StatCard icon="&#128200;" label="Unsold (R2)" value={unsold} color="text-amber-400" accent="bg-amber-500" />
            <StatCard icon="&#127942;" label="Teams" value={teams.length} color="text-purple-400" accent="bg-purple-500" />
          </div>

          {/* Points pool */}
          <div className="bg-slate-900/70 p-6 rounded-2xl border border-cyan-500/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-300">Point Pool Distribution</span>
              <span className="text-xs text-cyan-400 font-bold font-mono">{spentPointsPool} spent / {totalPointsPool} total pts</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, spentPercentage)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-glow"
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>{Math.round(spentPercentage)}% Spent</span>
              <span>{remainingPointsPool} pts available</span>
            </div>
          </div>

          {/* Recent assignments */}
          <div className="bg-slate-900/70 p-6 rounded-2xl border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">&#128176;</span>
              <h2 className="text-xl font-bold">Recent Assignments</h2>
              {recentSales.length > 0 && (
                <span className="ml-auto text-xs bg-cyan-500/15 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {sold} sold
                </span>
              )}
            </div>

            {recentSales.length === 0 ? (
              <div className="p-6 bg-black/20 rounded-xl text-center">
                <p className="text-slate-400 text-sm">No players sold yet.</p>
                <p className="text-slate-500 text-xs mt-1">Sold players will appear here in real time.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSales.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 bg-black/30 rounded-xl border border-white/5 hover:bg-black/40 transition">
                    <img
                      src={p.photo_url || playerPlaceholder}
                      alt={p.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-cyan-500/30 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{p.full_name}</p>
                      <p className="text-xs text-slate-500">{p.position || 'N/A'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-cyan-400 font-semibold">{p.team_name || 'Unknown'}</p>
                      <p className="text-xs text-yellow-400 font-mono font-bold">{p.sold_price} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
