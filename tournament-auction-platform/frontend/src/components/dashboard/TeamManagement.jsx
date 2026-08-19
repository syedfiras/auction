import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';

export default function TeamManagement({ tournamentId, tournamentStatus }) {
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTeams = async () => {
    if (!tournamentId) return;
    try {
      const data = await api.getTeams(tournamentId);
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  const fetchCaptains = async () => {
    try {
      const data = await api.getCaptains(tournamentId);
      setCaptains(data);
    } catch (err) {
      console.error('Failed to load captains', err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchCaptains();

    const socket = initSocket();
    if (socket) {
      const handlePlayerSold = () => {
        fetchTeams();
      };
      socket.on('playerSold', handlePlayerSold);
      return () => {
        socket.off('playerSold', handlePlayerSold);
      };
    }
  }, [tournamentId]);

  const createTeam = async () => {
    if (!newTeamName || !selectedCaptain) return;
    setCreating(true);
    try {
      await api.createTeam({ name: newTeamName, tournament_id: tournamentId, captain_id: selectedCaptain });
      setNewTeamName('');
      setSelectedCaptain('');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!tournamentId) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">&#127942;</span>
          <h2 className="text-2xl font-bold">Teams &amp; Captains</h2>
        </div>
        <p className="text-slate-400 text-sm">Create a tournament first, then add teams here.</p>
      </div>
    );
  }

  const canEdit = tournamentStatus === 'draft' || tournamentStatus === 'active';

  return (
    <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">&#127942;</span>
        <h2 className="text-2xl font-bold">Teams &amp; Captains</h2>
        {teams.length > 0 && (
          <span className="ml-auto text-xs bg-cyan-500/15 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            {teams.length} teams
          </span>
        )}
      </div>

      <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
        {teams.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">No teams created yet.</p>
        )}
        {teams.map(team => (
          <div key={team.id} className="p-3 bg-black/30 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <p className="font-bold">{team.name}</p>
              <span className="text-cyan-400 text-sm font-mono font-semibold">{team.remaining_points}pts</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Captain: <span className="text-gray-300">{team.captain_name || 'Unassigned'}</span>
            </p>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-xs text-gray-500 font-medium">Add a team and choose a captain from registered players</p>
          <input
            type="text"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
          />
          <select
            value={selectedCaptain}
            onChange={(e) => setSelectedCaptain(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">Select a captain</option>
            {captains.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <button
            onClick={createTeam}
            disabled={creating || !newTeamName || !selectedCaptain}
            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white p-2.5 rounded-lg font-bold transition disabled:opacity-50"
          >
            {creating ? 'Adding...' : 'Add Team'}
          </button>
        </div>
      )}
    </div>
  );
}
