import { create } from 'zustand';

export const useAuctionStore = create((set) => ({
  currentPlayer: null,
  currentBid: 0,
  timer: 30,
  isActive: false,
  myTeamId: null,
  remainingPoints: 0,
  squad: [],
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setCurrentBid: (bid) => set({ currentBid: bid }),
  setTimer: (time) => set({ timer: time }),
  setIsActive: (active) => set({ isActive: active }),
  setMyTeamId: (id) => set({ myTeamId: id }),
  setRemainingPoints: (points) => set({ remainingPoints: points }),
  setSquad: (squad) => set({ squad }),
  reset: () => set({
    currentPlayer: null,
    currentBid: 0,
    timer: 30,
    isActive: false,
  }),
}));