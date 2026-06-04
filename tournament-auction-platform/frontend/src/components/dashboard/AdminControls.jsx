import { useAdminAuction } from '../../hooks/useAdminAuction';
import { useAuctionStore } from '../../stores/auctionStore';

export default function AdminControls({ tournamentId, disabled, onAuctionEnded }) {
  const { status, connected, emitAdmin } = useAdminAuction(tournamentId, onAuctionEnded);
  const { currentPlayer, currentBid, timer, isActive } = useAuctionStore();

  if (!tournamentId) {
    return (
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-2xl">&#9878;</div>
          <h2 className="text-2xl font-bold">Auction Controls</h2>
        </div>
        <p className="text-gray-400 text-sm">Create and activate a tournament first.</p>
      </div>
    );
  }

  const startAuction = () => emitAdmin('admin:startAuction', { tournamentId });
  const pauseAuction = () => emitAdmin('admin:pauseAuction', { tournamentId });
  const resumeAuction = () => emitAdmin('admin:resumeAuction', { tournamentId });
  const skipPlayer = () => emitAdmin('admin:skipPlayer', { tournamentId });
  const markUnsold = () => emitAdmin('admin:markUnsold', { tournamentId });
  const endAuction = () => {
    if (!window.confirm('End the entire auction? The current player will be finalized.')) return;
    emitAdmin('admin:endAuction', { tournamentId });
  };

  const Btn = ({ onClick, disabled: btnDisabled, color, label }) => (
    <button
      onClick={onClick}
      disabled={btnDisabled ?? disabled}
      className={`${color} p-3 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition text-sm`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">&#9878;</div>
        <h2 className="text-2xl font-bold">Auction Controls</h2>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`} />
        <span className={`text-sm ${connected ? 'text-green-400' : 'text-orange-400'}`}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {disabled && tournamentId && (
        <div className="text-yellow-400 text-xs bg-yellow-900/20 p-2 rounded-lg mb-3">
          Activate the tournament to enable auction controls.
        </div>
      )}

      {status && (
        <div className="text-cyan-300 text-sm bg-cyan-900/10 p-2 rounded-lg mb-3">{status}</div>
      )}

      {isActive && currentPlayer && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-xl border border-cyan-500/20">
          <p className="font-bold text-lg">{currentPlayer.full_name}</p>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="text-cyan-400">Bid: {currentBid}</span>
            <span className={timer <= 10 ? 'text-red-400 font-bold' : 'text-gray-300'}>Timer: {timer}s</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Btn onClick={startAuction} color="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500" label="Start" />
        <Btn onClick={pauseAuction} color="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500" label="Pause" />
        <Btn onClick={resumeAuction} color="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" label="Resume" />
        <Btn onClick={skipPlayer} color="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500" label="Skip" />
        <Btn onClick={markUnsold} color="bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600" label="Unsold" />
        <Btn
          onClick={endAuction}
          disabled={disabled || (!isActive && !currentPlayer)}
          color="bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-600 hover:to-violet-600"
          label="End All"
        />
      </div>
    </div>
  );
}