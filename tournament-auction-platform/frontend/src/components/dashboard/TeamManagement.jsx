import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function TeamManagement({ tournamentId }) {
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState('');

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
    await api.createTeam({ name: newTeamName, tournament_id: tournamentId, captain_id: selectedCaptain });
    setNewTeamName('');
    setSelectedCaptain('');
    fetchTeams();
  };

  if (!tournamentId) {
    return (
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
        <h2 className="text-2xl font-bold mb-4">Teams & Captains</h2>
        <p className="text-gray-400">Create a tournament first, then add teams here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
      <h2 className="text-2xl font-bold mb-4">Teams & Captains</h2>
      <div className="space-y-3 mb-6">
        {teams.map(team => (
          <div key={team.id} className="p-3 bg-black/30 rounded-lg">
            <p className="font-bold">{team.name}</p>
            <p className="text-sm text-gray-300">Captain: {team.captain_name || 'Unassigned'}</p>
            <p className="text-sm text-cyan-400">Points: {team.remaining_points}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white"
        />
        <select
          value={selectedCaptain}
          onChange={(e) => setSelectedCaptain(e.target.value)}
          className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white"
        >
          <option value="">Select captain</option>
          {captains.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <button onClick={createTeam} className="w-full bg-cyan-600 p-2 rounded font-bold">Add Team</button>
      </div>
    </div>
  );
}