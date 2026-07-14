import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';

export default function PlayerCaptainList({ tournamentId }) {
  const [tab, setTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const [playerFilter, setPlayerFilter] = useState('approved');
  const [assigningPlayerId, setAssigningPlayerId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [pointsValue, setPointsValue] = useState(0);

  useEffect(() => {
    if (tab === 'players') {
      fetchPlayers();
      fetchTeams();
    } else {
      fetchCaptains();
    }

    const socket = initSocket();
    if (socket) {
      const handleUpdate = () => {
        if (tab === 'players') {
          fetchPlayers();
          fetchTeams();
        } else {
          fetchCaptains();
        }
      };

      socket.on('playerApproved', handleUpdate);
      socket.on('playerRegistered', handleUpdate);
      socket.on('playerSold', handleUpdate);
      socket.on('playerUnsold', handleUpdate);

      return () => {
        socket.off('playerApproved', handleUpdate);
        socket.off('playerRegistered', handleUpdate);
        socket.off('playerSold', handleUpdate);
        socket.off('playerUnsold', handleUpdate);
      };
    }
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

  const fetchTeams = async () => {
    if (!tournamentId) return;
    try {
      const data = await api.getTeams(tournamentId);
      setTeams(data);
    } catch (err) {
      console.error(err);
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

  const handleConfirmAssign = async (playerId) => {
    if (!selectedTeamId || pointsValue === '') return;
    try {
      await api.assignPlayer(playerId, { team_id: selectedTeamId, points: Number(pointsValue) });
      setAssigningPlayerId(null);
      setSelectedTeamId('');
      setPointsValue(0);
      await fetchPlayers();
      await fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkUnsold = async (playerId) => {
    try {
      await api.markPlayerUnsold(playerId);
      await fetchPlayers();
      await fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnassign = async (playerId) => {
    if (!window.confirm("Remove player from team and refund points?")) return;
    try {
      await api.unassignPlayer(playerId);
      await fetchPlayers();
      await fetchTeams();
    } catch (err) {
      alert(err.message);
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

  const filteredPlayers = players.filter(p => p.status === playerFilter);

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

      {tab === 'players' && (
        <div className="flex gap-1.5 mb-4 p-1 bg-black/40 rounded-lg max-w-lg border border-white/5">
          {['approved', 'unsold', 'sold'].map(f => (
            <button
              key={f}
              onClick={() => {
                setPlayerFilter(f);
                setAssigningPlayerId(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold capitalize transition ${playerFilter === f ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {f === 'approved' ? 'Round 1' : f === 'unsold' ? 'Round 2 (Unsold)' : 'Sold'} ({players.filter(p => p.status === f).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : tab === 'players' ? (
        filteredPlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No players in this category.</div>
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {filteredPlayers.map(p => (
              <div key={p.id} className="p-3 bg-black/30 rounded-xl hover:bg-black/40 border border-white/5 transition">
                <div className="flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{p.full_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${STATUS_BADGE[p.status] || 'text-gray-400'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.position || 'N/A'} &middot; Age: {p.age} &middot; Foot: {p.preferred_foot}
                      {p.team_name && <span className="text-cyan-400 font-medium"> &middot; Team: {p.team_name} ({p.sold_price} pts)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {p.status === 'approved' && (
                      <>
                        <button
                          onClick={() => {
                            setAssigningPlayerId(assigningPlayerId === p.id ? null : p.id);
                            setSelectedTeamId('');
                            setPointsValue(0);
                          }}
                          className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          {assigningPlayerId === p.id ? 'Cancel' : 'Assign'}
                        </button>
                        <button
                          onClick={() => handleMarkUnsold(p.id)}
                          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          Unsold
                        </button>
                      </>
                    )}
                    {p.status === 'unsold' && (
                      <button
                        onClick={() => {
                          setAssigningPlayerId(assigningPlayerId === p.id ? null : p.id);
                          setSelectedTeamId('');
                          setPointsValue(0);
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        {assigningPlayerId === p.id ? 'Cancel' : 'Assign R2'}
                      </button>
                    )}
                    {p.status === 'sold' && (
                      <button
                        onClick={() => handleUnassign(p.id)}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1 rounded text-xs font-semibold transition border border-red-500/30"
                      >
                        Unassign
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePlayer(p.id, p.full_name)}
                      disabled={deleting === p.id}
                      className="opacity-0 group-hover:opacity-100 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded transition disabled:opacity-50 text-xs"
                      title="Delete Player permanently"
                    >
                      &#x1f5d1;
                    </button>
                  </div>
                </div>

                {assigningPlayerId === p.id && (
                  <div className="mt-3 p-3 bg-cyan-950/40 rounded-lg border border-cyan-500/20 space-y-2">
                    <p className="text-xs font-semibold text-cyan-300">Assign {p.full_name} to:</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="flex-1 p-2 rounded bg-black/60 border border-cyan-500/20 text-white text-xs focus:outline-none"
                      >
                        <option value="">Select a team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.remaining_points} pts left)</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Points"
                        value={pointsValue}
                        onChange={(e) => setPointsValue(Math.max(0, Number(e.target.value)))}
                        className="w-24 p-2 rounded bg-black/60 border border-cyan-500/20 text-white text-center text-xs focus:outline-none"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-xs pt-1">
                      <button
                        onClick={() => setAssigningPlayerId(null)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded font-medium transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmAssign(p.id)}
                        disabled={!selectedTeamId || pointsValue === ''}
                        className="px-4 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-bold transition disabled:opacity-50"
                      >
                        Confirm Assignment
                      </button>
                    </div>
                  </div>
                )}
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
              <div key={c.id} className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg hover:bg-black/40 transition group border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{c.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {c.email}
                    {c.team_name && <span> &middot; Team: <span className="text-cyan-400 font-medium">{c.team_name}</span></span>}
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
