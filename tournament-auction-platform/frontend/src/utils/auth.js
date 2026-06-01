/** Role from JWT-backed user (MySQL) or legacy Supabase-shaped user */
export function getUserRole(user) {
  if (!user) return null;
  return user.role ?? user.user_metadata?.role ?? null;
}

export function getDashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'captain') return '/captain';
  if (role === 'player') return '/player';
  return '/login';
}
