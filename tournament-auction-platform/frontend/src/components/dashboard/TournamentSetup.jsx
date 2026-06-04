import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

const STATUS_BADGE = {
  draft: 'bg-yellow-600/30 text-yellow-400 border-yellow-600/40',
  active: 'bg-green-600/30 text-green-400 border-green-600/40',
  completed: 'bg-blue-600/30 text-blue-400 border-blue-600/40',
};

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
  const [message, setMessage] = useState({ text: '', type: '' });

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
    setMessage({ text: '', type: '' });
    try {
      const created = await api.createTournament(form);
      setMessage({ text: `"${created.name}" created as draft.`, type: 'success' });
      onTournamentChange(created);
      setForm({ name: '', location: '', date: '', points_per_team: 1000, squad_limit: 18, timer_seconds: 30 });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleActivate = async () => {
    if (!tournament?.id) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const active = await api.activateTournament(tournament.id);
      setMessage({ text: `"${active.name}" is now active!`, type: 'success' });
      onTournamentChange(active);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30 space-y-4">
      <div className="flex items-center gap-2">
        <div className="text-2xl">&#127944;</div>
        <h2 className="text-2xl font-bold">Tournament Setup</h2>
      </div>

      {tournament ? (
        <div className="p-4 bg-black/30 rounded-xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-lg text-white">{tournament.name}</p>
              <p className="text-sm text-gray-400">
                {tournament.location} &middot; {tournament.date || 'No date set'}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_BADGE[tournament.status] || 'text-gray-400'}`}>
              {tournament.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-cyan-900/20 p-2 rounded">
              <p className="text-cyan-400 font-bold">{tournament.points_per_team}</p>
              <p className="text-gray-400 text-xs">Points</p>
            </div>
            <div className="bg-cyan-900/20 p-2 rounded">
              <p className="text-cyan-400 font-bold">{tournament.squad_limit}</p>
              <p className="text-gray-400 text-xs">Squad Limit</p>
            </div>
            <div className="bg-cyan-900/20 p-2 rounded">
              <p className="text-cyan-400 font-bold">{tournament.timer_seconds}s</p>
              <p className="text-gray-400 text-xs">Timer</p>
            </div>
          </div>
          {tournament.status === 'draft' && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={loading}
              className="w-full mt-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-3 rounded-xl font-bold transition disabled:opacity-50"
            >
              {loading ? 'Activating...' : 'Activate Tournament'}
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 bg-black/20 rounded-xl text-center">
          <p className="text-gray-400">No tournament yet</p>
          <p className="text-gray-500 text-xs mt-1">Create one below to get started</p>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-3 border-t border-gray-700/50 pt-4">
        <p className="text-sm text-gray-400 font-medium">Create a new tournament</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="name" placeholder="Tournament name *" value={form.name} onChange={handleChange} required
            className="col-span-full p-2.5 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none" />
          <input name="location" placeholder="Location *" value={form.location} onChange={handleChange} required
            className="p-2.5 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none" />
          <input name="date" type="date" value={form.date} onChange={handleChange} required
            className="p-2.5 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-gray-400 text-xs block mb-1">Points</label>
            <input name="points_per_team" type="number" value={form.points_per_team} onChange={handleChange}
              className="w-full p-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none text-center" />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">Squad Limit</label>
            <input name="squad_limit" type="number" value={form.squad_limit} onChange={handleChange}
              className="w-full p-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none text-center" />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">Timer (s)</label>
            <input name="timer_seconds" type="number" value={form.timer_seconds} onChange={handleChange}
              className="w-full p-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none text-center" />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-2.5 rounded-xl font-bold transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
      </form>

      {message.text && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm p-2 rounded ${message.type === 'error' ? 'text-red-400 bg-red-900/20' : 'text-cyan-300 bg-cyan-900/20'}`}
        >
          {message.text}
        </motion.p>
      )}
    </motion.div>
  );
}
