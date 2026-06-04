CREATE DATABASE IF NOT EXISTS tournament_auction;
USE tournament_auction;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin','captain','player') NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tournaments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  date DATE,
  points_per_team INT DEFAULT 1000,
  squad_limit INT DEFAULT 18,
  timer_seconds INT DEFAULT 30,
  status ENUM('draft','active','completed') DEFAULT 'draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(500),
  captain_id INT UNIQUE,
  remaining_points INT,
  tournament_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  age INT,
  phone VARCHAR(20),
  position VARCHAR(50),
  preferred_foot VARCHAR(20),
  photo_url VARCHAR(500),
  status ENUM('pending','approved','rejected','captain','sold','unsold') DEFAULT 'pending',
  tournament_id INT,
  registered_by INT,
  approved_by INT,
  sold_to_team INT,
  sold_price INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (registered_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (sold_to_team) REFERENCES teams(id)
);

CREATE TABLE auctions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT,
  player_id INT,
  winning_team_id INT,
  winning_bid INT,
  status VARCHAR(20),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (winning_team_id) REFERENCES teams(id)
);

CREATE TABLE bids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT,
  team_id INT,
  bid_amount INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
