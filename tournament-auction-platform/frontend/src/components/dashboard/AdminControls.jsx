import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';
import { useAdminAuction } from '../../hooks/useAdminAuction';
import { useAuctionStore } from '../../stores/auctionStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminControls({ tournamentId, disabled, onAuctionEnded, onDataDeleted }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Selection/Input states for assigning the active player
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [bidPoints, setBidPoints] = useState(100);
  const [selectedRound, setSelectedRound] = useState(1);
  const [soldPopup, setSoldPopup] = useState(null);
  const [cleaning, setCleaning] = useState(false);

  // Initialize admin socket controller
  const { status: socketStatus, emitAdmin } = useAdminAuction(tournamentId);
  const { currentPlayer, timer, isActive } = useAuctionStore();

  const fetchStats = async () => {
    if (!tournamentId) return;
    try {
      const [allPlayers, allTeams, currentTour] = await Promise.all([
        api.getAllPlayers(tournamentId),
        api.getTeams(tournamentId),
        api.getCurrentTournament()
      ]);
      setPlayers(allPlayers);
      setTeams(allTeams);
      setTournament(currentTour);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const socket = initSocket();
    if (socket) {
      const handleUpdate = () => {
        fetchStats();
      };

      const handleAuctionCompleted = () => {
        fetchStats();
        onAuctionEnded?.();
      };
      
      const onPlayerSold = (payload) => {
        fetchStats();
        if (payload && payload.teamId) {
          setSoldPopup({
            playerName: payload.player?.full_name,
            photoUrl: payload.player?.photo_url,
            teamName: payload.teamName,
            price: payload.price
          });
        }
      };

      socket.on('playerApproved', handleUpdate);
      socket.on('playerRegistered', handleUpdate);
      socket.on('playerSold', onPlayerSold);
      socket.on('playerUnsold', handleUpdate);
      socket.on('pointsUpdated', handleUpdate);
      socket.on('auctionCompleted', handleAuctionCompleted);

      return () => {
        socket.off('playerApproved', handleUpdate);
        socket.off('playerRegistered', handleUpdate);
        socket.off('playerSold', onPlayerSold);
        socket.off('playerUnsold', handleUpdate);
        socket.off('pointsUpdated', handleUpdate);
        socket.off('auctionCompleted', handleAuctionCompleted);
      };
    }
  }, [tournamentId, onAuctionEnded]);

  // Set default bid points when a new player is selected
  useEffect(() => {
    if (currentPlayer) {
      setSelectedTeamId('');
      setBidPoints(0);
    }
  }, [currentPlayer]);

  if (!tournamentId) {
    return (
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-2xl">&#9878;</div>
          <h2 className="text-2xl font-bold">Tournament Stats</h2>
        </div>
        <p className="text-gray-400 text-sm">Create and activate a tournament to view statistics.</p>
      </div>
    );
  }

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!currentPlayer) return;
    if (!selectedTeamId) {
      alert('Please select a team');
      return;
    }
    if (bidPoints === undefined || bidPoints === null || bidPoints < 0) {
      alert('Points cannot be negative');
      return;
    }
    
    // Check points
    const teamObj = teams.find(t => t.id === selectedTeamId);
    if (teamObj && teamObj.remaining_points < bidPoints) {
      alert(`Insufficient points! ${teamObj.name} only has ${teamObj.remaining_points} points left.`);
      return;
    }

    try {
      await api.assignPlayer(currentPlayer.id, {
        team_id: selectedTeamId,
        points: Number(bidPoints)
      });
      setSelectedTeamId('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkUnsold = async () => {
    if (!currentPlayer) return;
    try {
      await api.markPlayerUnsold(currentPlayer.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePause = () => {
    emitAdmin('admin:pauseAuction', { tournamentId });
  };

  const handleResume = () => {
    emitAdmin('admin:resumeAuction', { tournamentId });
  };

  const handleAddTime = () => {
    emitAdmin('admin:addTime', { tournamentId, seconds: 5 });
  };

  const handleStartAuction = () => {
    emitAdmin('admin:startAuction', { tournamentId, round: selectedRound });
  };

  const handleEndAuction = () => {
    if (window.confirm('Are you sure you want to end the auction early? This will complete the tournament status.')) {
      emitAdmin('admin:endAuction', { tournamentId });
    }
  };

  const handleDeleteAllData = async () => {
    if (!tournamentId || !tournament) return;
    if (!window.confirm(
      `Delete "${tournament.name}" and ALL auction data?\n\nPlayers, captains, teams, bids, and tournament data will be permanently removed.`
    )) return;

    setCleaning(true);
    try {
      await api.cleanupTournament(tournamentId);
      setPlayers([]);
      setTeams([]);
      setTournament(null);
      onDataDeleted?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setCleaning(false);
    }
  };

  const totalPlayers = players.length;
  const pendingPlayers = players.filter(p => p.status === 'pending').length;
  const approvedPlayers = players.filter(p => p.status === 'approved').length;
  const unsoldPlayers = players.filter(p => p.status === 'unsold').length;
  const soldPlayers = players.filter(p => p.status === 'sold').length;
  const canStartSelectedRound = tournament?.status === 'active'
    || (selectedRound === 2 && unsoldPlayers > 0);

  const totalPointsPool = teams.length * (tournament?.points_per_team || 1000);
  const remainingPointsPool = teams.reduce((acc, t) => acc + (t.remaining_points || 0), 0);
  const spentPointsPool = totalPointsPool - remainingPointsPool;
  const spentPercentage = totalPointsPool > 0 ? (spentPointsPool / totalPointsPool) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Live Auction Engine Controls */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-cyan-500/30 relative overflow-hidden shadow-2xl shadow-cyan-950/20">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-xl font-bold tracking-wide">Live Auction Control Room</h3>
          </div>
          {socketStatus && <span className="text-xs bg-cyan-950 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 font-mono">{socketStatus}</span>}
        </div>

        {tournament?.status === 'completed' && (
          <div className="mb-4 bg-red-950/35 border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-red-200 uppercase tracking-wide">Auction ended</p>
              <p className="text-xs text-red-100/70 mt-0.5">Delete all database data for this auction before starting fresh.</p>
            </div>
            <button
              onClick={handleDeleteAllData}
              disabled={cleaning}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-bold transition"
            >
              {cleaning ? 'Deleting...' : 'Delete All Data'}
            </button>
          </div>
        )}

        {!currentPlayer ? (
          <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">No player is currently active in the auction pool.</p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-300">Target Round:</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(Number(e.target.value))}
                  className="bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value={1}>Round 1 (Approved Players)</option>
                  <option value={2}>Round 2 (Unsold Players)</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleStartAuction}
              disabled={disabled && !canStartSelectedRound}
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 text-black font-extrabold px-6 py-3 rounded-xl shadow-lg transition duration-200"
            >
              {selectedRound === 2 ? 'Start Unsold Players Auction' : 'Start Auction Loop'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Column 1: Active Player Info */}
            <div className="bg-black/35 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={currentPlayer.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="90" fill="%23333" stroke="%2300cccc" stroke-width="6"/%3E%3Ctext x="100" y="115" text-anchor="middle" fill="%2300cccc" font-size="60"%3E👤%3C/text%3E%3C/svg%3E'}
                  alt={currentPlayer.full_name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 shadow-md"
                />
                <span className="absolute bottom-0 right-0 bg-cyan-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  {currentPlayer.position || 'Player'}
                </span>
              </div>
              <h4 className="text-lg font-bold mt-3 text-white truncate max-w-full">{currentPlayer.full_name}</h4>
              
              <div className="mt-4 flex gap-2 w-full">
                <button
                  onClick={handleMarkUnsold}
                  className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs py-2 rounded-lg font-semibold transition"
                >
                  Send to Unsold
                </button>
              </div>
            </div>

            {/* Column 2: Timer & State Controller */}
            <div className="bg-black/35 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Countdown Timer</p>
              
              <div className={`text-5xl md:text-6xl font-mono font-extrabold my-3 tracking-wider ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {timer}s
              </div>

              <div className="flex flex-wrap justify-center gap-2 w-full mt-2">
                {isActive ? (
                  <button
                    onClick={handlePause}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-bold transition"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="bg-green-500 hover:bg-green-400 text-black text-xs px-3 py-1.5 rounded-lg font-bold transition"
                  >
                    Resume
                  </button>
                )}
                
                <button
                  onClick={handleAddTime}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs px-3 py-1.5 rounded-lg font-extrabold transition flex items-center gap-1"
                >
                  +5s
                </button>

                <button
                  onClick={handleEndAuction}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition"
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Column 3: Assign form */}
            <form onSubmit={handleAssign} className="bg-black/35 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-2.5">Direct Manual Assignment</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Select Winning Team</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                      required
                    >
                      <option value="">-- Choose Team --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.remaining_points} pts left)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Assigned Points / Winning Bid</label>
                    <input
                      type="number"
                      value={bidPoints}
                      onChange={(e) => setBidPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-400"
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-extrabold py-2.5 rounded-lg text-sm transition shadow-lg"
              >
                Assign &amp; Sell Player
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SOLD confirmation popup modal */}
      <AnimatePresence>
        {soldPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-black p-6 md:p-8 rounded-3xl border border-green-500/30 max-w-md w-full text-center relative shadow-2xl shadow-green-950/20"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSoldPopup(null)}
                  className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center font-bold transition text-sm"
                >
                  &times;
                </button>
              </div>

              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-4xl mx-auto mb-4 border border-green-500/30 animate-bounce">
                ✓
              </div>

              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 uppercase tracking-widest">
                Player Sold!
              </h3>

              <div className="my-6">
                <img
                  src={soldPopup.photoUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="90" fill="%23333" stroke="%2300cccc" stroke-width="6"/%3E%3Ctext x="100" y="115" text-anchor="middle" fill="%2300cccc" font-size="60"%3E👤%3C/text%3E%3C/svg%3E'}
                  alt={soldPopup.playerName}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-green-400 shadow-lg mb-4"
                />
                <h4 className="text-2xl font-bold text-white">{soldPopup.playerName}</h4>
                
                <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5">
                  <p className="text-xs uppercase text-gray-400 tracking-wider">Allocated to</p>
                  <p className="text-lg font-bold text-white mt-0.5">{soldPopup.teamName}</p>
                  <p className="text-xl font-extrabold text-yellow-400 font-mono mt-1">{soldPopup.price} points</p>
                </div>
              </div>

              <button
                onClick={() => setSoldPopup(null)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summary Statistics Card */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-2xl">&#128202;</div>
          <h2 className="text-2xl font-bold">Tournament Stats &amp; Overview</h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-400">Loading stats...</div>
        ) : (
          <div className="space-y-6">
            {/* Points Bar */}
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Point Pool Distribution</span>
                <span className="text-xs text-cyan-400 font-bold font-mono">{spentPointsPool} spent / {totalPointsPool} total pts</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, spentPercentage)}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>{Math.round(spentPercentage)}% Spent</span>
                <span>{remainingPointsPool} pts available</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Players</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">{totalPlayers}</p>
              </div>
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Approved (R1)</p>
                <p className="text-2xl font-bold text-green-400 font-mono mt-1">{approvedPlayers}</p>
              </div>
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Unsold (R2)</p>
                <p className="text-2xl font-bold text-amber-500 font-mono mt-1">{unsoldPlayers}</p>
              </div>
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Assigned / Sold</p>
                <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">{soldPlayers}</p>
              </div>
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-400 font-mono mt-1">{pendingPlayers}</p>
              </div>
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Teams</p>
                <p className="text-2xl font-bold text-purple-400 font-mono mt-1">{teams.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
