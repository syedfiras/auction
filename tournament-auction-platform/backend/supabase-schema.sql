-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Public bucket used by player photo uploads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Profiles table for the app's JWT auth.
-- Admins are seeded by the backend. Everyone who signs up starts as a player.
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'captain', 'player')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  date DATE,
  points_per_team INT DEFAULT 1000,
  squad_limit INT DEFAULT 18,
  timer_seconds INT DEFAULT 30,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  captain_id UUID REFERENCES profiles(id),
  remaining_points INT,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INT,
  phone TEXT,
  position TEXT,
  preferred_foot TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'captain', 'sold', 'unsold')),
  tournament_id UUID REFERENCES tournaments(id),
  registered_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  sold_to_team UUID REFERENCES teams(id),
  sold_price INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction records
CREATE TABLE auctions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  player_id UUID REFERENCES players(id),
  winning_team_id UUID REFERENCES teams(id),
  winning_bid INT,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Bids log
CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id),
  team_id UUID REFERENCES teams(id),
  bid_amount INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to deduct points (used by auction engine)
CREATE OR REPLACE FUNCTION deduct_points(team_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE teams SET remaining_points = remaining_points - amount WHERE id = team_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (simplified for development; adjust for production)
-- The backend uses SUPABASE_SERVICE_ROLE_KEY, so RLS can stay disabled while developing.
-- Enable and add policies before exposing direct browser access to these tables.
