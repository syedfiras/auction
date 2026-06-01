import { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function PlayerRegistrationForm({ onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    age: '',
    phone: '',
    position: 'Striker',
    preferred_foot: 'Right',
    experience: '',
    photo_url: '',
    skill_rating: 50,
    tournament_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tournament = await api.getActiveTournament();
      if (!tournament) {
        alert('No active tournament found');
        setLoading(false);
        return;
      }
      await api.registerPlayer({ ...form, tournament_id: tournament.id });
      alert('Registration submitted for approval');
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
      <h2 className="text-2xl font-bold mb-4">Register as a Player</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white" />
        <input name="age" type="number" placeholder="Age" onChange={handleChange} required className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white" />
        <input name="phone" placeholder="Phone" onChange={handleChange} required className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white" />
        <select name="position" onChange={handleChange} className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white">
          <option>Striker</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
        </select>
        <select name="preferred_foot" onChange={handleChange} className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white">
          <option>Right</option><option>Left</option><option>Both</option>
        </select>
        <input name="experience" placeholder="Experience (e.g., 2 years)" onChange={handleChange} className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white" />
        <input name="photo_url" placeholder="Photo URL" onChange={handleChange} className="w-full p-2 rounded bg-black/50 border border-gray-600 text-white" />
        <input name="skill_rating" type="range" min="0" max="100" onChange={handleChange} className="w-full" />
        <button type="submit" disabled={loading} className="w-full bg-cyan-600 p-2 rounded font-bold">Submit Registration</button>
      </form>
    </div>
  );
}