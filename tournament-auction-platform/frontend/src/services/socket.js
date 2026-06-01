import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket;

export const initSocket = () => {
  const token = useAuthStore.getState().session?.access_token;
  if (!token) return null;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(backendUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
};

/** Run callback once socket is connected */
export const whenSocketReady = (callback) => {
  const s = initSocket() || socket;
  if (!s) return null;
  if (s.connected) {
    callback(s);
    return s;
  }
  s.once('connect', () => callback(s));
  return s;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};