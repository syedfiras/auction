import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import auctionSocket from './sockets/auctionSocket.js';
import adminRoutes from './routes/admin.js';
import captainRoutes from './routes/captain.js';
import playerRoutes from './routes/player.js';
import tournamentRoutes from './routes/tournament.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/captain', captainRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);

auctionSocket(io);
app.set('io', io);

httpServer.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});