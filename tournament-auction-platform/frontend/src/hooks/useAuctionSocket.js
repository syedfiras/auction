import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useAuctionStore } from '../stores/auctionStore';
import { useAuthStore } from '../stores/authStore';
import { getUserRole } from '../utils/auth';
import { api } from '../services/api';

export const useAuctionSocket = (tournamentId) => {
  const {
    setCurrentPlayer,
    setCurrentBid,
    setTimer,
    setIsActive,
    setMyTeamId,
    setRemainingPoints,
    setSquad,
  } = useAuctionStore();

  const session = useAuthStore(state => state.session);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join auction room
    socket.emit('joinAuctionRoom', { tournamentId, teamId: useAuctionStore.getState().myTeamId });

    // Listeners
    socket.on('randomPlayerSelected', setCurrentPlayer);
    socket.on('bidPlaced', ({ bidAmount }) => setCurrentBid(bidAmount));
    socket.on('timerUpdated', setTimer);
    socket.on('timerResetTo10', () => setTimer(10));
    socket.on('auctionStarted', () => setIsActive(true));
    socket.on('auctionPaused', () => setIsActive(false));
    socket.on('auctionResumed', () => setIsActive(true));
    socket.on('auctionCompleted', () => {
      setIsActive(false);
      setCurrentPlayer(null);
    });
    socket.on('playerSold', () => {
      // Refresh squad and points
      fetchTeamData();
    });
    socket.on('outbidNotification', (data) => {
      // Show toast or alert
      console.log('Outbid!', data);
    });

    const fetchTeamData = async () => {
      if (getUserRole(session?.user) !== 'captain') return;
      try {
        const team = await api.getMyTeam();
        setMyTeamId(team.id);
        setRemainingPoints(team.remaining_points);
        const squadData = await api.getMySquad();
        setSquad(squadData);
      } catch (err) {
        console.error('Failed to refresh team data', err);
      }
    };
    fetchTeamData();

    return () => {
      socket.off('randomPlayerSelected');
      socket.off('bidPlaced');
      socket.off('timerUpdated');
      socket.off('timerResetTo10');
      socket.off('auctionStarted');
      socket.off('auctionPaused');
      socket.off('auctionResumed');
      socket.off('auctionCompleted');
      socket.off('playerSold');
      socket.off('outbidNotification');
    };
  }, [tournamentId, session]);
};