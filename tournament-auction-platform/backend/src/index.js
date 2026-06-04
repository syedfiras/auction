import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase, must } from './config/db.js';
import auctionSocket from './sockets/auctionSocket.js';
import adminRoutes from './routes/admin.js';
import captainRoutes from './routes/captain.js';
import playerRoutes from './routes/player.js';
import tournamentRoutes from './routes/tournament.js';
import authRoutes from './routes/auth.js';

dotenv.config();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'password123';
  try {
    const existing = await must(await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle());
    if (!existing) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await must(await supabase
        .from('profiles')
        .insert({ email, password_hash: hashedPassword, full_name: 'Admin', role: 'admin' }));
      console.log(`Admin seeded: ${email}`);
    }
  } catch (err) {
    console.error('Admin seed failed:', err.message);
  }
}

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].map(origin => origin?.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/captain', captainRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);

auctionSocket(io);
app.set('io', io);

seedAdmin().then(() => {
  httpServer.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});
