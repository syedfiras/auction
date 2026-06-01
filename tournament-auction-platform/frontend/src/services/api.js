import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const session = useAuthStore.getState().session;
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, full_name, role, phone) => 
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name, role, phone }) }),

  // Admin
  createTournament: (data) => request('/api/admin/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentTournament: () => request('/api/admin/tournaments/current'),
  activateTournament: (id) => request(`/api/admin/tournaments/${id}/activate`, { method: 'PUT' }),
  getPendingPlayers: () => request('/api/admin/players/pending'),
  approvePlayer: (id) => request(`/api/admin/players/${id}/approve`, { method: 'PUT' }),
  rejectPlayer: (id) => request(`/api/admin/players/${id}/reject`, { method: 'PUT' }),
  createTeam: (data) => request('/api/admin/teams', { method: 'POST', body: JSON.stringify(data) }),
  getTeams: (tournamentId) => request(`/api/admin/teams?tournamentId=${tournamentId}`),
  getCaptains: (tournamentId) =>
    request(`/api/admin/captains${tournamentId ? `?tournamentId=${tournamentId}` : ''}`),

  // Captain
  getMyTeam: () => request('/api/captain/my-team'),
  getMySquad: () => request('/api/captain/squad'),

  // Player
  registerPlayer: (data) => request('/api/player/register', { method: 'POST', body: JSON.stringify(data) }),
  getMyRegistration: () => request('/api/player/my-registration'),

  // Tournament
  getActiveTournament: () => request('/api/tournaments/active'),
};