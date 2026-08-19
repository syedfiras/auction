import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import AdminControls from '../components/dashboard/AdminControls';
import PlayerApproval from '../components/dashboard/PlayerApproval';
import TeamManagement from '../components/dashboard/TeamManagement';
import TournamentSetup from '../components/dashboard/TournamentSetup';
import PlayerCaptainList from '../components/dashboard/PlayerCaptainList';
import OverviewStats from '../components/dashboard/OverviewStats';
import { initSocket } from '../services/socket';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '\u{1F4CA}' },
  { id: 'auction', label: 'Auction Control', icon: '\u{1F3A4}' },
  { id: 'players', label: 'Players', icon: '\u{1F465}' },
  { id: 'teams', label: 'Teams', icon: '\u{1F3C6}' },
  { id: 'setup', label: 'Tournament Setup', icon: '\u{2699}\uFE0F' },
];

const STATUS_BADGE = {
  draft: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  active: 'bg-green-500/15 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [tournament, setTournament] = useState(null);
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [cleaning, setCleaning] = useState(false);
  const tournamentId = tournament?.id;

  const fetchTournament = useCallback(async () => {
    try {
      const data = await api.getCurrentTournament();
      setTournament(data);
    } catch (err) {
      console.error('Failed to load tournament', err);
    }
  }, []);

  const fetchPendingPlayers = useCallback(async () => {
    try {
      const data = await api.getPendingPlayers(tournamentId);
      setPendingPlayers(data);
    } catch (err) {
      console.error(err);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
    fetchPendingPlayers();

    const socket = initSocket();
    if (socket) {
      const handleUpdate = () => {
        fetchPendingPlayers();
      };

      socket.on('playerRegistered', handleUpdate);
      socket.on('playerApproved', handleUpdate);
      socket.on('playerRejected', handleUpdate);

      return () => {
        socket.off('playerRegistered', handleUpdate);
        socket.off('playerApproved', handleUpdate);
        socket.off('playerRejected', handleUpdate);
      };
    }
  }, [fetchTournament, fetchPendingPlayers]);

  const handleCleanup = async () => {
    if (!tournament?.id) return;
    if (!window.confirm(
      `Delete "${tournament.name}" and ALL its data?\n\nPlayers, teams, auctions, and bids will be permanently removed.`
    )) return;
    setCleaning(true);
    try {
      await api.cleanupTournament(tournament.id);
      setTournament(null);
      setPendingPlayers([]);
    } catch (err) {
      alert(err.message);
    } finally {
      setCleaning(false);
    }
  };

  const handleDataDeleted = () => {
    setTournament(null);
    setPendingPlayers([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col md:flex-row md:items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
              <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">Manage tournaments, players, teams, and auctions</p>
          </div>
          <div className="flex items-center gap-3">
            {tournament && (
              <span className={`text-xs px-3 py-1.5 rounded-full border font-medium uppercase tracking-wider ${STATUS_BADGE[tournament.status] || 'text-slate-400'}`}>
                {tournament.name} &middot; {tournament.status}
              </span>
            )}
            <button
              onClick={() => window.open('/viewer', '_blank')}
              className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              &#128250; Viewer
            </button>
          </div>
        </motion.header>

        {/* Tab bar */}
        <nav className="sticky top-14 z-40 -mx-4 px-4 md:-mx-8 md:px-8 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 mb-6">
          <div className="flex gap-1.5 overflow-x-auto py-2.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition relative ${
                  tab === t.id
                    ? 'text-black bg-gradient-to-r from-cyan-400 to-indigo-400 shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'overview' && <OverviewStats tournament={tournament} />}

            {tab === 'auction' && (
              <AdminControls
                tournamentId={tournament?.id}
                disabled={tournament?.status !== 'active'}
                onAuctionEnded={fetchTournament}
                onDataDeleted={handleDataDeleted}
              />
            )}

            {tab === 'players' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <PlayerApproval
                    players={pendingPlayers}
                    onUpdate={fetchPendingPlayers}
                  />
                </div>
                <div className="lg:col-span-2">
                  <PlayerCaptainList tournamentId={tournament?.id ?? null} />
                </div>
              </div>
            )}

            {tab === 'teams' && (
              <TeamManagement
                tournamentId={tournament?.id}
                tournamentStatus={tournament?.status}
              />
            )}

            {tab === 'setup' && (
              <div className="space-y-6 max-w-3xl">
                <TournamentSetup tournament={tournament} onTournamentChange={setTournament} />

                {tournament && (
                  <div className="bg-red-950/30 backdrop-blur-xl p-6 rounded-2xl border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-red-300">&#9888;&#65039; Danger Zone</p>
                      <p className="text-sm text-red-200/60 mt-0.5">
                        Delete all players, teams, and tournament data to start fresh.
                      </p>
                    </div>
                    <button
                      onClick={handleCleanup}
                      disabled={cleaning}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition shrink-0"
                    >
                      {cleaning ? 'Deleting...' : 'Delete All Data'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
