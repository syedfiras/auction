import { supabase, must } from '../config/db.js';

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
    const tournament = await must(await supabase
      .from('tournaments')
      .select('timer_seconds')
      .eq('id', this.tournamentId)
      .maybeSingle());
    this.timer = tournament?.timer_seconds ?? 30;
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
    const players = await must(await supabase
      .from('players')
      .select('*')
      .eq('tournament_id', this.tournamentId)
      .eq('status', 'approved'));
    if (!players || players.length === 0) {
      this.currentPlayer = null;
      await must(await supabase.from('tournaments').update({ status: 'completed' }).eq('id', this.tournamentId));
      this.io.to(this.room).emit('auctionCompleted', { reason: 'no_more_players' });
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

    const team = await must(await supabase
      .from('teams')
      .select('remaining_points, tournaments(squad_limit)')
      .eq('id', teamId)
      .maybeSingle());
    if (!team) throw new Error('Team not found');
    if (team.remaining_points < bidAmount) throw new Error('Insufficient points');

    const { count, error } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('sold_to_team', teamId)
      .eq('status', 'sold');
    if (error) throw error;
    if ((count || 0) >= (team.tournaments?.squad_limit || 18)) throw new Error('Squad full');

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
      const team = await must(await supabase
        .from('teams')
        .select('name, remaining_points')
        .eq('id', this.highestTeamId)
        .single());
      await must(await supabase
        .from('teams')
        .update({ remaining_points: team.remaining_points - this.currentBid })
        .eq('id', this.highestTeamId));
      await must(await supabase
        .from('players')
        .update({ status: 'sold', sold_to_team: this.highestTeamId, sold_price: this.currentBid })
        .eq('id', this.currentPlayer.id));
      await must(await supabase
        .from('auctions')
        .insert({
          tournament_id: this.tournamentId,
          player_id: this.currentPlayer.id,
          winning_team_id: this.highestTeamId,
          winning_bid: this.currentBid,
          status: 'sold',
          ended_at: new Date().toISOString(),
        }));
      const teamName = team.name;
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
      await must(await supabase.from('players').update({ status: 'unsold' }).eq('id', this.currentPlayer.id));
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
    await must(await supabase.from('tournaments').update({ status: 'completed' }).eq('id', this.tournamentId));
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

