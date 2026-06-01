import { useState } from 'react';
import { api } from '../../services/api';

export default function TournamentSetup({ tournament, onTournamentChange }) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    date: '',
    points_per_team: 1000,
    squad_limit: 18,
    timer_seconds: 30,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['points_per_team', 'squad_limit', 'timer_seconds'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const created = await api.createTournament(form);
      setMessage(`Tournament "${created.name}" created (draft).`);
      onTournamentChange(created);
      setForm({
        name: '',
        location: '',
        date: '',
        points_per_team: 1000,
        squad_limit: 18,
        timer_seconds: 30,
      });
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  const handleActivate = async () => {
    if (!tournament?.id) return;
    setLoading(true);
    setMessage('');
    try {
      const active = await api.activateTournament(tournament.id);
      setMessage(`"${active.name}" is now active. Players can register and the auction can start.`);
      onTournamentChange(active);
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30 space-y-4">
      <h2 className="text-2xl font-bold">Tournament Setup</h2>

      {tournament ? (
        <div className="p-4 bg-black/30 rounded-lg space-y-2">
          <p className="font-bold text-lg">{tournament.name}</p>
          <p className="text-sm text-gray-300">
            {tournament.location} · {tournament.date}
          </p>
          <p className="text-sm">
            Points: {tournament.points_per_team} · Squad limit: {tournament.squad_limit} · Timer:{' '}
            {tournament.timer_seconds}s
          </p>
          <p className="text-sm">
            Status:{' '}
            <span
              className={
                tournament.status === 'active' ? 'text-green-400' : 'text-yellow-400'
              }
            >
              {tournament.status}
            </span>
          </p>
          {tournament.status === 'draft' && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={loading}
              className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold"
            >
              Activate Tournament
            </button>
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No tournament yet. Create one below.</p>
      )}

      <form onSubmit={handleCreate} className="space-y-3 border-t border-gray-700 pt-4">
        <p className="text-sm text-gray-400">Create a new tournament (starts as draft)</p>
        <input
          name="name"
          placeholder="Tournament name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white"
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
          className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white"
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            name="points_per_team"
            type="number"
            placeholder="Points"
            value={form.points_per_team}
            onChange={handleChange}
            className="p-2 rounded bg-black/50 border border-gray-600 text-white"
          />
          <input
            name="squad_limit"
            type="number"
            placeholder="Squad limit"
            value={form.squad_limit}
            onChange={handleChange}
            className="p-2 rounded bg-black/50 border border-gray-600 text-white"
          />
          <input
            name="timer_seconds"
            type="number"
            placeholder="Timer (s)"
            value={form.timer_seconds}
            onChange={handleChange}
            className="p-2 rounded bg-black/50 border border-gray-600 text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 p-2 rounded font-bold"
        >
          Create Tournament
        </button>
      </form>

      {message && <p className="text-sm text-cyan-300">{message}</p>}
    </div>
  );
}
