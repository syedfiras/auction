import { useAdminAuction } from '../../hooks/useAdminAuction';
import { useAuctionStore } from '../../stores/auctionStore';

export default function AdminControls({ tournamentId, disabled, onAuctionEnded }) {
  const { status, connected, emitAdmin } = useAdminAuction(tournamentId, onAuctionEnded);
  const { currentPlayer, currentBid, timer, isActive } = useAuctionStore();

  if (!tournamentId) {
    return (
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
        <h2 className="text-2xl font-bold mb-2">Auction Controls</h2>
        <p className="text-gray-400">Create and activate a tournament first.</p>
      </div>
    );
  }

  const startAuction = () => emitAdmin('admin:startAuction', { tournamentId });
  const pauseAuction = () => emitAdmin('admin:pauseAuction', { tournamentId });
  const resumeAuction = () => emitAdmin('admin:resumeAuction', { tournamentId });
  const skipPlayer = () => emitAdmin('admin:skipPlayer', { tournamentId });
  const markUnsold = () => emitAdmin('admin:markUnsold', { tournamentId });
  const endAuction = () => {
    if (!window.confirm('End the entire auction now? The current player will be finalized and no more players will be auctioned.')) {
      return;
    }
    emitAdmin('admin:endAuction', { tournamentId });
  };

  const btnClass = (color) =>
    `${color} p-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
      <h2 className="text-2xl font-bold mb-4">Auction Controls</h2>
      {disabled && (
        <p className="text-yellow-400 text-sm mb-3">Activate the tournament before starting the auction.</p>
      )}
      <p className={`text-sm mb-3 ${connected ? 'text-green-400' : 'text-orange-400'}`}>
        Socket: {connected ? 'connected' : 'connecting…'}
      </p>
      {status && <p className="text-cyan-300 text-sm mb-3">{status}</p>}
      {isActive && currentPlayer && (
        <div className="mb-4 p-3 bg-black/30 rounded-lg text-sm">
          <p className="font-bold">{currentPlayer.full_name}</p>
          <p className="text-gray-400">
            Current bid: {currentBid} · Timer: {timer}s
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={startAuction} disabled={disabled} className={btnClass('bg-green-600 hover:bg-green-700')}>Start</button>
        <button onClick={pauseAuction} disabled={disabled} className={btnClass('bg-yellow-600 hover:bg-yellow-700')}>Pause</button>
        <button onClick={resumeAuction} disabled={disabled} className={btnClass('bg-blue-600 hover:bg-blue-700')}>Resume</button>
        <button onClick={skipPlayer} disabled={disabled} className={btnClass('bg-orange-600 hover:bg-orange-700')}>Skip Player</button>
        <button onClick={markUnsold} disabled={disabled} className={btnClass('bg-red-600 hover:bg-red-700')}>Mark Unsold</button>
        <button
          onClick={endAuction}
          disabled={disabled || (!isActive && !currentPlayer)}
          className={btnClass('bg-purple-700 hover:bg-purple-800')}
        >
          End Auction
        </button>
      </div>
    </div>
  );
}