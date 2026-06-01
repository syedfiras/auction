import { useEffect, useState } from 'react';
import { getSocket, initSocket, whenSocketReady } from '../services/socket';
import { useAuctionStore } from '../stores/auctionStore';

export function useAdminAuction(tournamentId, onAuctionEnded) {
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState(false);
  const {
    setCurrentPlayer,
    setCurrentBid,
    setTimer,
    setIsActive,
  } = useAuctionStore();

  useEffect(() => {
    if (!tournamentId) return undefined;

    const socket = initSocket();
    if (!socket) {
      setStatus('Not logged in - refresh and try again.');
      return undefined;
    }

    const onConnect = () => {
      setConnected(true);
      socket.emit('joinAuctionRoom', { tournamentId });
    };

    const onDisconnect = () => setConnected(false);

    if (socket.connected) onConnect();
    else socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('auctionStarted', () => {
      setIsActive(true);
      setStatus('Auction started.');
    });
    socket.on('auctionPaused', () => {
      setIsActive(false);
      setStatus('Auction paused.');
    });
    socket.on('auctionResumed', () => {
      setIsActive(true);
      setStatus('Auction resumed.');
    });
    socket.on('auctionCompleted', (payload) => {
      setIsActive(false);
      setCurrentPlayer(null);
      setCurrentBid(0);
      setStatus(
        payload?.reason === 'ended_by_admin'
          ? 'Auction ended. Tournament marked as completed.'
          : 'Auction completed - no more approved players.'
      );
      onAuctionEnded?.(payload);
    });
    socket.on('auctionError', (msg) => setStatus(typeof msg === 'string' ? msg : 'Could not start auction'));
    socket.on('randomPlayerSelected', (player) => {
      setCurrentPlayer(player);
      setStatus(`Now auctioning: ${player.full_name}`);
    });
    socket.on('bidPlaced', ({ bidAmount }) => setCurrentBid(bidAmount));
    socket.on('timerUpdated', setTimer);
    socket.on('playerSold', () => setStatus('Player sold - picking next...'));
    socket.on('playerUnsold', () => setStatus('Player unsold - picking next...'));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('auctionStarted');
      socket.off('auctionPaused');
      socket.off('auctionResumed');
      socket.off('auctionCompleted');
      socket.off('auctionError');
      socket.off('randomPlayerSelected');
      socket.off('bidPlaced');
      socket.off('timerUpdated');
      socket.off('playerSold');
      socket.off('playerUnsold');
    };
  }, [tournamentId, setCurrentPlayer, setCurrentBid, setTimer, setIsActive]);

  const emitAdmin = (event, payload) => {
    whenSocketReady((s) => s.emit(event, payload));
  };

  return { status, connected, emitAdmin, socket: getSocket() };
}
