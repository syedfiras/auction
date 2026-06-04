import { useState } from 'react';
import { api } from '../../services/api';

export default function PlayerRegistrationForm({ onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    age: '',
    phone: '',
    position: 'Striker',
    preferred_foot: 'Right',
    photo: null,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setForm({ ...form, photo: e.target.files?.[0] || null });
  };

  const isFormComplete =
    form.full_name.trim() &&
    form.age &&
    Number(form.age) > 0 &&
    form.phone.trim() &&
    form.position &&
    form.preferred_foot &&
    form.photo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormComplete) return;
    setLoading(true);
    setErr('');
    try {
      const tournament = await api.getActiveTournament();
      if (!tournament) {
        setErr('No active tournament found');
        setLoading(false);
        return;
      }
      const payload = new FormData();
      payload.append('full_name', form.full_name.trim());
      payload.append('age', form.age);
      payload.append('phone', form.phone.trim());
      payload.append('position', form.position);
      payload.append('preferred_foot', form.preferred_foot);
      payload.append('tournament_id', tournament.id);
      payload.append('photo', form.photo);

      await api.registerPlayer(payload);
      alert('Registration submitted for approval!');
      onSuccess();
    } catch (err) {
      setErr(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold">Register as a Player</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="full_name" placeholder="Full Name *" value={form.full_name} onChange={handleChange} required className="col-span-full p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none" />
          <input name="age" type="number" placeholder="Age *" value={form.age} onChange={handleChange} required className="p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none" />
          <input name="phone" placeholder="Phone *" value={form.phone} onChange={handleChange} required className="p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select name="position" value={form.position} onChange={handleChange} className="p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none">
            <option>Striker</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
          </select>
          <select name="preferred_foot" value={form.preferred_foot} onChange={handleChange} className="p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none">
            <option>Right</option><option>Left</option><option>Both</option>
          </select>
        </div>
        <div>
          <label className="text-slate-600 text-sm block mb-1">Player Photo *</label>
          <input
            name="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            required
            className="w-full p-2.5 rounded-md bg-white border border-slate-300 text-slate-950 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white focus:border-slate-900 focus:outline-none"
          />
          {form.photo && <p className="mt-1 text-xs text-slate-500">{form.photo.name}</p>}
        </div>
        {err && <p className="text-red-700 text-sm bg-red-50 border border-red-200 p-2 rounded-md">{err}</p>}
        <button type="submit" disabled={loading || !isFormComplete} className="w-full bg-slate-950 hover:bg-slate-800 text-white p-2.5 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
}
