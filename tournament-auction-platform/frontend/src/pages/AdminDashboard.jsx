import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import AdminControls from '../components/dashboard/AdminControls';
import PlayerApproval from '../components/dashboard/PlayerApproval';
import TeamManagement from '../components/dashboard/TeamManagement';
import TournamentSetup from '../components/dashboard/TournamentSetup';
import PlayerCaptainList from '../components/dashboard/PlayerCaptainList';
import { initSocket } from '../services/socket';

export default function AdminDashboard() {
  const [tournament, setTournament] = useState(null);
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [cleaning, setCleaning] = useState(false);

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
      const data = await api.getPendingPlayers(tournament?.id);
      setPendingPlayers(data);
    } catch (err) {
      console.error(err);
    }
  }, [tournament?.id]);

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-950">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Manage tournaments, players, teams, and auctions</p>
          </div>
          <button
            onClick={() => window.open('/viewer', '_blank')}
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Viewer
          </button>
        </motion.div>

        {tournament?.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-white border border-red-200 rounded-lg flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-red-700">Tournament completed</p>
              <p className="text-sm text-slate-500">Delete all players, teams, and data to start fresh.</p>
            </div>
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2 rounded-md font-semibold text-sm text-white transition"
            >
              {cleaning ? 'Deleting...' : 'Delete All Data'}
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TournamentSetup tournament={tournament} onTournamentChange={setTournament} />
            <AdminControls
              tournamentId={tournament?.id}
              disabled={tournament?.status !== 'active'}
              onAuctionEnded={fetchTournament}
              onDataDeleted={() => {
                setTournament(null);
                setPendingPlayers([]);
              }}
            />
            <PlayerApproval
              players={pendingPlayers}
              onUpdate={fetchPendingPlayers}
              tournamentActive={tournament?.status === 'active'}
            />
          </div>
          <div>
            <TeamManagement
              tournamentId={tournament?.id}
              tournamentStatus={tournament?.status}
            />
          </div>
        </div>

        <div className="mt-6">
          <PlayerCaptainList tournamentId={tournament?.id ?? null} />
        </div>
      </div>
    </div>
  );
}
