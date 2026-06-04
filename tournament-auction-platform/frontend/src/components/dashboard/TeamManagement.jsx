import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function TeamManagement({ tournamentId, tournamentStatus }) {
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchCaptains();
  }, [tournamentId]);

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
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Teams &amp; Captains</h2>
        </div>
        <p className="text-slate-500 text-sm">Create a tournament first, then add teams here.</p>
      </div>
    );
  }

  const canEdit = tournamentStatus === 'draft' || tournamentStatus === 'active';

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold">Teams &amp; Captains</h2>
      </div>

      <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
        {teams.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">No teams created yet.</p>
        )}
        {teams.map(team => (
          <div key={team.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="font-bold">{team.name}</p>
              <span className="text-slate-600 text-sm font-mono">{team.remaining_points}pts</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Captain: <span className="text-slate-700">{team.captain_name || 'Unassigned'}</span>
            </p>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 font-medium">Add a team and choose a captain from registered players</p>
          <input
            type="text"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-full p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none"
          />
          <select
            value={selectedCaptain}
            onChange={(e) => setSelectedCaptain(e.target.value)}
            className="w-full p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none"
          >
            <option value="">Select a captain</option>
            {captains.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <button
            onClick={createTeam}
            disabled={creating || !newTeamName || !selectedCaptain}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white p-2.5 rounded-md font-semibold transition disabled:opacity-50"
          >
            {creating ? 'Adding...' : 'Add Team'}
          </button>
        </div>
      )}
    </div>
  );
}
