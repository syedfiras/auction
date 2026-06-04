import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

export default function PlayerCaptainList({ tournamentId }) {
  const [tab, setTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (tab === 'players') fetchPlayers();
    else fetchCaptains();
  }, [tab, tournamentId]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await api.getAllPlayers(tournamentId);
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaptains = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCaptains(tournamentId);
      setCaptains(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id, name) => {
    if (!window.confirm(`Delete player "${name}"? This will also remove their auction/bid history.`)) return;
    setDeleting(id);
    try {
      await api.deletePlayer(id);
      setPlayers(p => p.filter(x => x.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCaptain = async (id, name) => {
    if (!window.confirm(`Delete captain "${name}"? They will be unlinked from any team.`)) return;
    setDeleting(id);
    try {
      await api.deleteUser(id);
      setCaptains(c => c.filter(x => x.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const STATUS_BADGE = {
    pending: 'bg-yellow-600/30 text-yellow-400',
    approved: 'bg-green-600/30 text-green-400',
    rejected: 'bg-red-600/30 text-red-400',
    captain: 'bg-indigo-600/30 text-indigo-300',
    sold: 'bg-blue-600/30 text-blue-400',
    unsold: 'bg-gray-600/30 text-gray-400',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">&#128101;</span>
        <h2 className="text-2xl font-bold">All Players &amp; Captains</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('players')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'players' ? 'bg-cyan-600 text-white' : 'bg-black/30 text-gray-300 hover:bg-black/50'}`}
        >
          Players ({players.length})
        </button>
        <button
          onClick={() => setTab('captains')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'captains' ? 'bg-cyan-600 text-white' : 'bg-black/30 text-gray-300 hover:bg-black/50'}`}
        >
          Captains ({captains.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : tab === 'players' ? (
        players.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No players registered yet.</div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg hover:bg-black/40 transition group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{p.full_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_BADGE[p.status] || 'text-gray-400'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {p.position || 'N/A'}
                    {p.team_name && <span> &middot; Team: {p.team_name}</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePlayer(p.id, p.full_name)}
                  disabled={deleting === p.id}
                  className="ml-2 opacity-0 group-hover:opacity-100 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                >
                  {deleting === p.id ? '...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        captains.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No captains registered yet.</div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {captains.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg hover:bg-black/40 transition group">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{c.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {c.email}
                    {c.team_name && <span> &middot; Team: <span className="text-cyan-400">{c.team_name}</span></span>}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCaptain(c.id, c.full_name)}
                  disabled={deleting === c.id}
                  className="ml-2 opacity-0 group-hover:opacity-100 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                >
                  {deleting === c.id ? '...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
}
