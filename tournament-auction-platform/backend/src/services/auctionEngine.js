import pool from '../config/db.js';

class AuctionEngine {
  constructor(io, tournamentId) {
    this.io = io;
    this.tournamentId = tournamentId;
    this.active = false;
    this.currentPlayer = null;
    this.currentBid = 0;
    this.highestTeamId = null;
    this.timer = 30;
    this.timerInterval = null;
    this.room = `tournament_${tournamentId}`;
  }

  async loadTournamentSettings() {
    const [rows] = await pool.query(
      'SELECT timer_seconds FROM tournaments WHERE id = ?',
      [this.tournamentId]
    );
    this.timer = rows[0]?.timer_seconds ?? 30;
  }

  async start() {
    await this.loadTournamentSettings();
    this.active = true;
    await this.pickRandomPlayer();
    if (!this.currentPlayer) {
      this.active = false;
      return false;
    }
    this.io.to(this.room).emit('timerUpdated', this.timer);
    this.startTimer();
    return true;
  }

  async pickRandomPlayer() {
    const [players] = await pool.query(
      `SELECT * FROM players
       WHERE tournament_id = ? AND status = 'approved'`,
      [this.tournamentId]
    );
    if (!players || players.length === 0) {
      this.currentPlayer = null;
      this.io.to(this.room).emit('auctionCompleted');
      this.stop();
      return;
    }
    const randomIndex = Math.floor(Math.random() * players.length);
    this.currentPlayer = players[randomIndex];
    this.currentBid = 0;
    this.highestTeamId = null;
    this.previousHighestTeamId = null;
    await this.loadTournamentSettings();
    this.io.to(this.room).emit('randomPlayerSelected', this.currentPlayer);
    this.io.to(this.room).emit('bidPlaced', { teamId: null, bidAmount: 0 });
    this.io.to(this.room).emit('timerUpdated', this.timer);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.active) return;
      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.endAuctionForCurrentPlayer();
      } else {
        this.timer--;
        this.io.to(this.room).emit('timerUpdated', this.timer);
      }
    }, 1000);
  }

  async placeBid(teamId, bidAmount, captainId) {
    if (!this.active) throw new Error('Auction not active');
    if (bidAmount <= this.currentBid) throw new Error('Bid must be higher');

    const [teamRows] = await pool.query(
      `SELECT t.remaining_points, tour.squad_limit
       FROM teams t
       JOIN tournaments tour ON t.tournament_id = tour.id
       WHERE t.id = ?`,
      [teamId]
    );
    if (teamRows.length === 0) throw new Error('Team not found');
    const team = teamRows[0];
    if (team.remaining_points < bidAmount) throw new Error('Insufficient points');

    const [squadRows] = await pool.query(
      'SELECT COUNT(*) as count FROM players WHERE sold_to_team = ? AND status = "sold"',
      [teamId]
    );
    if (squadRows[0].count >= team.squad_limit) throw new Error('Squad full');

    const wasSniping = this.timer <= 10;
    this.currentBid = bidAmount;
    this.highestTeamId = teamId;
    if (wasSniping) {
      this.timer = 10;
      this.io.to(this.room).emit('timerResetTo10', 10);
    }

    this.io.to(this.room).emit('bidPlaced', { teamId, bidAmount });
    if (this.previousHighestTeamId && this.previousHighestTeamId !== teamId) {
      this.io.to(`team_${this.previousHighestTeamId}`).emit('outbidNotification', {
        newBid: bidAmount,
        playerName: this.currentPlayer.full_name
      });
    }
    this.previousHighestTeamId = teamId;
    return { success: true };
  }

  pause() {
    this.active = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  resume() {
    if (!this.currentPlayer) return;
    this.active = true;
    if (!this.timerInterval) this.startTimer();
    this.io.to(this.room).emit('timerUpdated', this.timer);
  }

  async finalizeCurrentPlayer() {
    if (!this.currentPlayer) return;
    if (this.highestTeamId && this.currentBid > 0) {
      await pool.query('UPDATE teams SET remaining_points = remaining_points - ? WHERE id = ?', [this.currentBid, this.highestTeamId]);
      await pool.query('UPDATE players SET status = "sold", sold_to_team = ?, sold_price = ? WHERE id = ?', [this.highestTeamId, this.currentBid, this.currentPlayer.id]);
      await pool.query(
        `INSERT INTO auctions (tournament_id, player_id, winning_team_id, winning_bid, status, ended_at)
         VALUES (?, ?, ?, ?, 'sold', NOW())`,
        [this.tournamentId, this.currentPlayer.id, this.highestTeamId, this.currentBid]
      );
      const [teamRows] = await pool.query('SELECT name FROM teams WHERE id = ?', [this.highestTeamId]);
      const teamName = teamRows[0]?.name;
      const soldPayload = {
        player: this.currentPlayer,
        teamId: this.highestTeamId,
        teamName,
        price: this.currentBid,
      };
      this.io.to(this.room).emit('playerSold', soldPayload);
      if (this.currentPlayer.registered_by) {
        this.io.to(`user_${this.currentPlayer.registered_by}`).emit('playerSoldNotification', {
          teamName,
          price: this.currentBid,
        });
      }
    } else {
      await pool.query('UPDATE players SET status = "unsold" WHERE id = ?', [this.currentPlayer.id]);
      this.io.to(this.room).emit('playerUnsold', this.currentPlayer);
    }
    this.currentPlayer = null;
    this.highestTeamId = null;
    this.currentBid = 0;
  }

  async endAuctionForCurrentPlayer() {
    if (!this.currentPlayer) return;
    this.pause();
    await this.finalizeCurrentPlayer();
    await this.pickRandomPlayer();
    if (this.currentPlayer) {
      this.active = true;
      this.startTimer();
    }
  }

  /** End the entire auction early (admin). */
  async complete() {
    this.pause();
    if (this.currentPlayer) {
      await this.finalizeCurrentPlayer();
    }
    await pool.query("UPDATE tournaments SET status = 'completed' WHERE id = ?", [this.tournamentId]);
    this.io.to(this.room).emit('auctionCompleted', { reason: 'ended_by_admin' });
    this.stop();
  }

  stop() {
    this.active = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
}

export default AuctionEngine;

// =====================================================
// SUPABASE ALTERNATIVE (commented)
// =====================================================
/*
import { supabase } from '../config/db.js';
class AuctionEngine {
  // ... same methods but using supabase queries
}
*/