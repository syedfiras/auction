import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { initSocket } from '../services/socket';

const playerPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect x="12" y="12" width="176" height="176" rx="18" fill="%231e293b" stroke="%2306b6d4" stroke-width="6"/%3E%3Ctext x="100" y="122" text-anchor="middle" fill="%2306b6d4" font-size="60"%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E';
const soldPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect x="12" y="12" width="176" height="176" rx="18" fill="%231e293b" stroke="%2310b981" stroke-width="6"/%3E%3Ctext x="100" y="122" text-anchor="middle" fill="%2310b981" font-size="60"%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E';

export default function Viewer() {
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [statusMsg, setStatusMsg] = useState('Waiting for allocations...');
  
  // Live auction states
  const [activePlayer, setActivePlayer] = useState(null);
  const [timer, setTimer] = useState(30);
  const [isActive, setIsActive] = useState(false);
  
  const fullscreenRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const t = await api.getCurrentTournament();
        if (!t || t.status === 'draft') {
          setStatusMsg('No active tournament. Activate the tournament first.');
          return;
        }
        setTournament(t);
        setStatusMsg(t.status === 'completed' ? 'Tournament completed' : 'Direct player allocations in progress...');

        const teamsData = await api.getTeams(t.id);
        setTeams(teamsData);

        const allPlayers = await api.getAllPlayers(t.id);
        const soldPlayers = allPlayers
          .filter(p => p.status === 'sold')
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRecentAssignments(soldPlayers.slice(0, 5));

        const socket = initSocket();
        if (!socket) return;

        socket.emit('joinAuctionRoom', { tournamentId: t.id });

        socket.on('randomPlayerSelected', (player) => {
          setActivePlayer(player);
          setIsActive(true);
        });

        socket.on('timerUpdated', (time) => {
          setTimer(time);
        });

        socket.on('auctionStarted', () => {
          setIsActive(true);
        });

        socket.on('auctionPaused', () => {
          setIsActive(false);
        });

        socket.on('auctionResumed', () => {
          setIsActive(true);
        });

        socket.on('auctionCompleted', () => {
          setActivePlayer(null);
          setIsActive(false);
          setStatusMsg('Auction completed.');
        });

        socket.on('playerSold', async ({ player, teamId, teamName, price }) => {
          setActivePlayer(null);
          if (!teamId) {
            // Unassignment occurred
            const teamsData = await api.getTeams(t.id);
            setTeams(teamsData);
            const allP = await api.getAllPlayers(t.id);
            const soldP = allP.filter(p => p.status === 'sold').sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            setRecentAssignments(soldP.slice(0, 5));
            return;
          }

          const assignedPlayer = {
            ...player,
            team_name: teamName,
            sold_price: price
          };

          setRecentAssignments(prev => {
            const filtered = prev.filter(p => p.id !== player.id);
            return [assignedPlayer, ...filtered].slice(0, 5);
          });

          const teamsData = await api.getTeams(t.id);
          setTeams(teamsData);
        });

        socket.on('playerUnsold', async () => {
          setActivePlayer(null);
          const allP = await api.getAllPlayers(t.id);
          const soldP = allP.filter(p => p.status === 'sold').sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          setRecentAssignments(soldP.slice(0, 5));
        });

        if (socket.connected) {
          socket.emit('joinAuctionRoom', { tournamentId: t.id });
        } else {
          socket.on('connect', () => {
            socket.emit('joinAuctionRoom', { tournamentId: t.id });
          });
        }
      } catch (err) {
        setStatusMsg('Failed to load tournament data');
      }
    };
    init();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const pointsColor = (pts) => {
    if (pts > 700) return 'text-green-400';
    if (pts > 300) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div ref={fullscreenRef} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden font-sans">
      <div className="h-screen flex flex-col p-4 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">⚽</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-400 tracking-wider uppercase">
                {tournament?.name || 'Auction Arena'}
              </h1>
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase">Live Room Broadcast</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusMsg && (
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-4 py-1.5 rounded-full uppercase tracking-wider">
                {statusMsg}
              </span>
            )}
            <button
              onClick={toggleFullscreen}
              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl border border-white/10 transition uppercase tracking-widest font-bold"
            >
              ⛶ Fullscreen
            </button>
          </div>
        </div>

        {/* Main Content Dashboard */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
          
          {/* Left Area (Live Auction / Showcase Card) */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {activePlayer ? (
                // ACTIVE PLAYER AUCTION SCREEN
                <motion.div
                  key={`active-${activePlayer.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-cyan-500/25 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-cyan-950/20"
                >
                  {/* Decorative glowing background mesh */}
                  <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
                  <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

                  {/* Header overlay */}
                  <div className="flex justify-between items-center z-10">
                    <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                      Live Bidding Open
                    </span>
                  </div>

                  {/* Player Profile Body */}
                  <div className="text-center my-auto z-10 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-2xl blur-xl opacity-20 scale-110" />
                      <img
                        src={activePlayer.photo_url || playerPlaceholder}
                        alt={activePlayer.full_name}
                        className="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover border-4 border-cyan-400 shadow-xl relative z-10"
                      />
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black mt-6 tracking-wide uppercase text-white drop-shadow-md">
                      {activePlayer.full_name}
                    </h2>
                    
                    <p className="text-sm md:text-base text-cyan-400 mt-2 uppercase tracking-widest font-extrabold bg-cyan-950/40 border border-cyan-500/20 px-5 py-1 rounded-full inline-block">
                      {activePlayer.position || 'N/A'}
                    </p>

                    {/* Additional Player Meta/Skills Info */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-md">
                      <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs">
                        <span className="text-gray-400">Skills:</span> <span className="font-bold">{activePlayer.skills || 'All-Rounder'}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs">
                        <span className="text-gray-400">Mobile:</span> <span className="font-bold">{activePlayer.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer Block at the bottom */}
                  <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between z-10">
                    <span className="text-gray-400 text-sm font-semibold">Physical bidding is active in the room...</span>
                    
                    {/* Pulsing Timer Button style */}
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Timer</span>
                      <div className={`text-4xl md:text-5xl font-mono font-black px-5 py-2.5 rounded-2xl bg-black/40 border ${timer <= 5 ? 'text-red-500 border-red-500/40 animate-pulse' : 'text-cyan-400 border-cyan-500/20'}`}>
                        {timer}s
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : recentAssignments.length > 0 ? (
                // SHOWCASE LATEST SOLD PLAYER VIEW
                <motion.div
                  key="showcase-sold"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 bg-gradient-to-b from-slate-900/80 to-slate-950/90 rounded-3xl border border-emerald-500/20 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-4 left-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Latest Allocation
                  </div>

                  <div className="text-center my-auto flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl opacity-20 scale-110" />
                      <img
                        src={recentAssignments[0].photo_url || soldPlaceholder}
                        alt={recentAssignments[0].full_name}
                        className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-emerald-400 shadow-lg shadow-emerald-500/10"
                      />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-extrabold mt-4 text-white tracking-tight uppercase">{recentAssignments[0].full_name}</h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold text-emerald-400">
                      {recentAssignments[0].position || 'N/A'}
                    </p>

                    <div className="mt-6 p-4 bg-emerald-950/30 rounded-2xl border border-emerald-500/25 inline-block min-w-[240px]">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assigned to</p>
                      <p className="text-xl md:text-2xl font-black text-white mt-0.5">{recentAssignments[0].team_name}</p>
                      <p className="text-2xl font-black text-yellow-400 mt-1 font-mono">{recentAssignments[0].sold_price} pts</p>
                    </div>
                  </div>

                  {/* Feed of other recent allocations */}
                  {recentAssignments.length > 1 && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex flex-col min-h-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Previous Allocations</p>
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                        {recentAssignments.slice(1).map((p) => (
                          <div key={p.id} className="bg-black/40 p-3 rounded-2xl border border-white/5 flex items-center gap-3 min-w-[240px] shrink-0">
                            <img
                              src={p.photo_url || playerPlaceholder}
                              alt={p.full_name}
                              className="w-10 h-10 rounded-lg object-cover border-2 border-cyan-400"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs truncate text-white">{p.full_name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{p.team_name}</p>
                              <p className="text-xs font-black text-yellow-400 font-mono mt-0.5">{p.sold_price} pts</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                // INITIAL/EMPTY WELCOME STATE
                <motion.div
                  key="empty-welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-10 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-5xl mb-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 animate-pulse">
                    ⚽
                  </div>
                  <h2 className="text-3xl md:text-5xl text-white font-black tracking-wider uppercase">Welcome to the Arena</h2>
                  <p className="text-gray-400 mt-3 max-w-md text-sm md:text-base">
                    The auction pool is ready. Wait for the admin to select and display the next active player.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Area (Teams Leaderboard / remaining points) */}
          <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-cyan-500/20 p-5 md:p-6 flex flex-col min-h-0 relative shadow-2xl">
            <h3 className="text-xl md:text-2xl font-black mb-4 flex items-center gap-2 shrink-0 tracking-wide uppercase">
              <span>🏆</span> Team Leaderboard
            </h3>
            <div className="flex-1 space-y-3 overflow-y-auto min-h-0 pr-1 scrollbar-thin">
              {teams.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">No teams created yet.</div>
              ) : (
                teams.map((team, i) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3.5 rounded-2xl border bg-black/40 border-white/5 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-base md:text-lg truncate text-white uppercase tracking-wide">
                          {team.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-wider">
                          Captain: {team.captain_name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`text-xl md:text-2xl font-mono font-black ${pointsColor(team.remaining_points)}`}>
                          {team.remaining_points}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">pts left</p>
                      </div>
                    </div>
                    {/* Points bar */}
                    <div className="mt-2.5 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (team.remaining_points / (tournament?.points_per_team || 1000)) * 100)}%` }}
                        className={`h-full rounded-full ${team.remaining_points > 700 ? 'bg-green-500' : team.remaining_points > 300 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
