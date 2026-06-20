import AuctionEngine from '../services/auctionEngine.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase } from '../config/db.js';
dotenv.config();

const activeAuctions = new Map();

function getOrCreateEngine(io, socket, tournamentId) {
  let engine = activeAuctions.get(tournamentId);
  if (!engine) {
    socket.join(`tournament_${tournamentId}`);
    engine = new AuctionEngine(io, tournamentId);
    activeAuctions.set(tournamentId, engine);
  }
  return engine;
}

export default function (io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch fresh profile from database to get the latest role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('id', decoded.id)
        .maybeSingle();
        
      if (error || !profile) {
        return next(new Error('User not found'));
      }
      
      socket.user = profile;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    const role = user.role;
    console.log(`[Socket Connected] User: ${user.email}, Role: ${role}, ID: ${user.id}`);
    socket.join(`user_${user.id}`);

    socket.on('joinAuctionRoom', async ({ tournamentId, teamId }) => {
      if (!tournamentId) return;
      socket.join(`tournament_${tournamentId}`);
      if (role === 'captain' && teamId) socket.join(`team_${teamId}`);
      if (role === 'admin') {
        getOrCreateEngine(io, socket, tournamentId);
      }
      const engine = activeAuctions.get(tournamentId);
      if (engine?.active && engine.currentPlayer) {
        socket.emit('randomPlayerSelected', engine.currentPlayer);
        socket.emit('bidPlaced', { teamId: engine.highestTeamId, bidAmount: engine.currentBid });
        socket.emit('timerUpdated', engine.timer);
        socket.emit('auctionStarted');
      }
    });

    socket.on('placeBid', async ({ tournamentId, bidAmount, teamId }) => {
      console.log(`[placeBid] User: ${user.email}, Role: ${role}, Team: ${teamId}, Bid: ${bidAmount}`);
      if (role !== 'captain') return socket.emit('error', 'Only captains can bid');
      const engine = activeAuctions.get(tournamentId);
      if (!engine) return socket.emit('error', 'Auction not active');
      try {
        await engine.placeBid(teamId, bidAmount, user.id);
      } catch (err) {
        socket.emit('bidRejected', err.message);
      }
    });

    socket.on('admin:startAuction', async ({ tournamentId }) => {
      if (role !== 'admin') {
        return socket.emit('auctionError', 'Only admins can start the auction');
      }
      if (!tournamentId) {
        return socket.emit('auctionError', 'Tournament ID is required');
      }
      try {
        const engine = getOrCreateEngine(io, socket, tournamentId);
        if (engine.active) {
          return socket.emit('auctionError', 'Auction is already running');
        }
        const started = await engine.start();
        if (!started) {
          return socket.emit('auctionError', 'No approved players available for auction');
        }
        io.to(`tournament_${tournamentId}`).emit('auctionStarted');
      } catch (err) {
        console.error('startAuction failed:', err);
        socket.emit('auctionError', err.message || 'Failed to start auction');
      }
    });

    socket.on('admin:pauseAuction', ({ tournamentId }) => {
      if (role !== 'admin') return;
      const engine = activeAuctions.get(tournamentId);
      if (engine) {
        engine.pause();
        io.to(`tournament_${tournamentId}`).emit('auctionPaused');
      }
    });

    socket.on('admin:resumeAuction', ({ tournamentId }) => {
      if (role !== 'admin') return;
      const engine = activeAuctions.get(tournamentId);
      if (engine) {
        engine.resume();
        io.to(`tournament_${tournamentId}`).emit('auctionResumed');
      }
    });

    socket.on('admin:skipPlayer', ({ tournamentId }) => {
      if (role !== 'admin') return;
      const engine = activeAuctions.get(tournamentId);
      if (engine) engine.endAuctionForCurrentPlayer();
    });

    socket.on('admin:markUnsold', ({ tournamentId }) => {
      if (role !== 'admin') return;
      const engine = activeAuctions.get(tournamentId);
      if (engine && engine.currentPlayer) {
        engine.highestTeamId = null;
        engine.currentBid = 0;
        engine.endAuctionForCurrentPlayer();
      }
    });

    socket.on('admin:endAuction', async ({ tournamentId }) => {
      if (role !== 'admin') {
        return socket.emit('auctionError', 'Only admins can end the auction');
      }
      if (!tournamentId) {
        return socket.emit('auctionError', 'Tournament ID is required');
      }
      const engine = activeAuctions.get(tournamentId);
      if (!engine) {
        return socket.emit('auctionError', 'No auction session found. Start the auction first.');
      }
      try {
        await engine.complete();
        activeAuctions.delete(tournamentId);
      } catch (err) {
        console.error('endAuction failed:', err);
        socket.emit('auctionError', err.message || 'Failed to end auction');
      }
    });
  });
}