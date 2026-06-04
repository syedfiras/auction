import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { initSocket, getSocket } from '../services/socket';

export default function Viewer() {
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [winningTeam, setWinningTeam] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Waiting for auction to start...');
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
        setStatusMsg(t.status === 'completed' ? 'Tournament completed' : 'Waiting for auction to start...');

        const teamsData = await api.getTeams(t.id);
        setTeams(teamsData);

        const socket = initSocket();
        if (!socket) return;

        socket.emit('joinAuctionRoom', { tournamentId: t.id });

        socket.on('auctionStarted', () => setIsActive(true));
        socket.on('auctionPaused', () => setIsActive(false));
        socket.on('auctionResumed', () => setIsActive(true));
        socket.on('auctionCompleted', () => {
          setIsActive(false);
          setCurrentPlayer(null);
          setStatusMsg('Auction completed!');
        });

        socket.on('randomPlayerSelected', (player) => {
          setCurrentPlayer(player);
          setCurrentBid(0);
          setWinningTeam(null);
          setStatusMsg(`Now auctioning: ${player.full_name}`);
        });

        socket.on('bidPlaced', ({ teamId, bidAmount }) => {
          setCurrentBid(bidAmount);
          setWinningTeam(teamId);
        });

        socket.on('timerUpdated', setTimer);

        socket.on('playerSold', async ({ teamId, teamName, price }) => {
          setStatusMsg(`Sold to ${teamName} for ${price} pts!`);
          setCurrentPlayer(null);
          const teamsData = await api.getTeams(t.id);
          setTeams(teamsData);
        });

        socket.on('playerUnsold', () => {
          setStatusMsg('Player went unsold');
          setCurrentPlayer(null);
        });

        socket.on('auctionError', (msg) => setStatusMsg(msg));

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
    <div ref={fullscreenRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      <div className="h-screen flex flex-col p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">&#9917;</span>
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">
              {tournament?.name || 'Auction Arena'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {statusMsg && (
              <span className="text-sm text-gray-400 bg-black/30 px-3 py-1 rounded-full">{statusMsg}</span>
            )}
            <button
              onClick={toggleFullscreen}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              title="Fullscreen"
            >
              &#9974; Fullscreen
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
          {/* Left: Current Player Card */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-6 md:p-10 flex flex-col items-center justify-center">
              {currentPlayer && isActive ? (
                <motion.div
                  key={currentPlayer.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center w-full max-w-lg"
                >
                  <img
                    src={currentPlayer.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="90" fill="%23333" stroke="%2300cccc" stroke-width="6"/%3E%3Ctext x="100" y="115" text-anchor="middle" fill="%2300cccc" font-size="60"%3E👤%3C/text%3E%3C/svg%3E'}
                    alt={currentPlayer.full_name}
                    className="w-40 h-40 md:w-52 md:h-52 rounded-full mx-auto object-cover border-6 border-cyan-400 shadow-glow-lg"
                  />
                  <h2 className="text-3xl md:text-5xl font-bold mt-6">{currentPlayer.full_name}</h2>
                  <p className="text-xl md:text-2xl text-gray-300 mt-2">
                    {currentPlayer.position || 'N/A'}
                  </p>

                  <div className="mt-8 flex items-center justify-center gap-8">
                    <motion.div
                      animate={timer <= 10 ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <span className={`text-7xl md:text-8xl font-mono font-bold ${timer <= 5 ? 'text-red-400' : timer <= 10 ? 'text-orange-400' : 'text-cyan-400'}`}>
                        {timer.toString().padStart(2, '0')}
                      </span>
                      <p className="text-sm text-gray-400 text-center mt-1">seconds</p>
                    </motion.div>

                    <div className="text-left">
                      <p className="text-lg text-gray-400">Current Bid</p>
                      <p className="text-5xl md:text-6xl font-bold text-yellow-400">{currentBid}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="text-8xl mb-6 opacity-30">&#9200;</div>
                  <p className="text-3xl md:text-5xl text-gray-400 font-light">{statusMsg}</p>
                  <p className="text-lg text-gray-500 mt-4">Projection screen &mdash; sit back and watch</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Teams & Points */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-4 md:p-6 flex flex-col min-h-0">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 shrink-0">
              <span>&#127942;</span> Teams
            </h3>
            <div className="flex-1 space-y-2 overflow-y-auto min-h-0 pr-1">
              {teams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No teams created yet.</p>
              ) : (
                teams.map((team, i) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      winningTeam === team.id
                        ? 'bg-cyan-900/30 border-cyan-400/60 shadow-glow scale-[1.02]'
                        : 'bg-black/30 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {winningTeam === team.id && (
                            <span className="text-cyan-400 text-lg">&#9654;</span>
                          )}
                          <p className={`font-bold text-lg md:text-xl truncate ${winningTeam === team.id ? 'text-cyan-300' : ''}`}>
                            {team.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Captain: {team.captain_name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`text-3xl md:text-4xl font-mono font-bold ${pointsColor(team.remaining_points)}`}>
                          {team.remaining_points}
                        </p>
                        <p className="text-xs text-gray-500">pts left</p>
                      </div>
                    </div>
                    {/* Points bar */}
                    <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
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
