// convex/currentAuctions.js - Mutations

import { mutation } from './_generated/server';
import { query } from './_generated/server';
import { v } from 'convex/values';

// Initialize auction state when auction starts
export const initializeAuction = mutation({
  args: {
    auctionId: v.id('auctions'),
    playerQueue: v.array(v.id('players')),
  },
  handler: async (ctx, args) => {
    const { auctionId, playerQueue } = args;

    // Check if auction state already exists
    const existing = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (existing) {
      throw new Error('Auction state already initialized');
    }

    return await ctx.db.insert('currentAuctions', {
      auctionId,
      playerQueue,
      unsoldPlayers: [],
      status: 'idle',
      currentPlayerId: undefined,
      countdownEndsAt: undefined,
      currentBid: undefined,
      currentBidderTeamId: undefined,
      bidHistory: [],
    });
  },
});

// Start auction or move to next player
export const startNextPlayer = mutation({
  args: {
    auctionId: v.id('auctions'),
    countdownDurationMs: v.optional(v.number()), // Default 60 seconds
  },
  handler: async (ctx, args) => {
    const { auctionId, countdownDurationMs = 60000 } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState) {
      throw new Error('Auction state not found');
    }

    if (auctionState.playerQueue.length === 0) {
      throw new Error('No more players to auction');
    }

    const nextPlayerId = auctionState.playerQueue[0];
    const remainingQueue = auctionState.playerQueue.slice(1);
    const countdownEndsAt = new Date(
      Date.now() + countdownDurationMs
    ).toISOString();

    await ctx.db.patch(auctionState._id, {
      currentPlayerId: nextPlayerId,
      playerQueue: remainingQueue,
      status: 'running',
      countdownEndsAt,
      currentBid: undefined,
      currentBidderTeamId: undefined,
      bidHistory: [],
    });

    return { currentPlayerId: nextPlayerId };
  },
});

// Place a bid
export const placeBid = mutation({
  args: {
    auctionId: v.id('auctions'),
    teamId: v.id('teams'),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { auctionId, teamId, amount } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState) {
      throw new Error('Auction state not found');
    }

    if (auctionState.status !== 'running') {
      throw new Error('Auction is not currently running');
    }

    if (!auctionState.currentPlayerId) {
      throw new Error('No player currently being auctioned');
    }

    // Validate bid amount
    if (auctionState.currentBid && amount <= auctionState.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }

    // Check if team has enough coins
    const team = await ctx.db.get(teamId);
    if (!team || team.coinsLeft < amount) {
      throw new Error('Insufficient coins');
    }

    // Check if countdown has expired
    if (
      auctionState.countdownEndsAt &&
      new Date() > new Date(auctionState.countdownEndsAt)
    ) {
      throw new Error('Bidding time has expired');
    }

    const timestamp = new Date().toISOString();
    const newBidHistory = [
      ...(auctionState.bidHistory || []),
      { teamId, amount, timestamp },
    ];

    await ctx.db.patch(auctionState._id, {
      currentBid: amount,
      currentBidderTeamId: teamId,
      bidHistory: newBidHistory,
    });

    return { success: true, currentBid: amount };
  },
});

// Extend countdown timer
export const extendCountdown = mutation({
  args: {
    auctionId: v.id('auctions'),
    extensionMs: v.number(),
  },
  handler: async (ctx, args) => {
    const { auctionId, extensionMs } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState || auctionState.status !== 'running') {
      throw new Error('Cannot extend countdown - auction not running');
    }

    const currentEnd = auctionState.countdownEndsAt
      ? new Date(auctionState.countdownEndsAt)
      : new Date();
    const newEnd = new Date(currentEnd.getTime() + extensionMs);

    await ctx.db.patch(auctionState._id, {
      countdownEndsAt: newEnd.toISOString(),
    });

    return { newCountdownEndsAt: newEnd.toISOString() };
  },
});

// Sell player to highest bidder
export const sellPlayer = mutation({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState || !auctionState.currentPlayerId) {
      throw new Error('No player currently being auctioned');
    }

    if (!auctionState.currentBidderTeamId || !auctionState.currentBid) {
      throw new Error('No bids placed for this player');
    }

    const playerId = auctionState.currentPlayerId;
    const teamId = auctionState.currentBidderTeamId;
    const finalBid = auctionState.currentBid;

    // Update player
    await ctx.db.patch(playerId, {
      teamId,
      isSold: true,
      currentBid: finalBid,
    });

    // Update team
    const team = await ctx.db.get(teamId);
    if (team) {
      await ctx.db.patch(teamId, {
        coinsLeft: team.coinsLeft - finalBid,
        totalPlayers: team.totalPlayers + 1,
        playerIds: [...team.playerIds, playerId],
      });
    }

    // Reset auction state for next player
    await ctx.db.patch(auctionState._id, {
      currentPlayerId: undefined,
      status: 'idle',
      countdownEndsAt: undefined,
      currentBid: undefined,
      currentBidderTeamId: undefined,
      bidHistory: [],
    });

    return {
      soldTo: teamId,
      amount: finalBid,
      playerId,
      hasMorePlayers: auctionState.playerQueue.length > 0,
    };
  },
});

// Mark player as unsold
export const markPlayerUnsold = mutation({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState || !auctionState.currentPlayerId) {
      throw new Error('No player currently being auctioned');
    }

    const playerId = auctionState.currentPlayerId;
    const unsoldPlayers = [...(auctionState.unsoldPlayers || []), playerId];

    // Reset auction state
    await ctx.db.patch(auctionState._id, {
      currentPlayerId: undefined,
      unsoldPlayers,
      status: 'idle',
      countdownEndsAt: undefined,
      currentBid: undefined,
      currentBidderTeamId: undefined,
      bidHistory: [],
    });

    return {
      unsoldPlayerId: playerId,
      hasMorePlayers: auctionState.playerQueue.length > 0,
    };
  },
});

// Pause/Resume auction
export const pauseAuction = mutation({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState) {
      throw new Error('Auction state not found');
    }

    const newStatus = auctionState.status === 'paused' ? 'running' : 'paused';

    await ctx.db.patch(auctionState._id, {
      status: newStatus,
    });

    return { status: newStatus };
  },
});

// Reset auction state
export const resetAuction = mutation({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;

    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();

    if (!auctionState) {
      throw new Error('Auction state not found');
    }

    await ctx.db.delete(auctionState._id);

    return { success: true };
  },
});
// convex/currentAuctions.js - Queries


// Get current auction state
export const getAuctionState = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    if (!auctionState) {
      return null;
    }
    
    // Get current player details if exists
    let currentPlayer = null;
    if (auctionState.currentPlayerId) {
      currentPlayer = await ctx.db.get(auctionState.currentPlayerId);
    }
    
    // Get current bidder team details if exists
    let currentBidderTeam = null;
    if (auctionState.currentBidderTeamId) {
      currentBidderTeam = await ctx.db.get(auctionState.currentBidderTeamId);
    }
    
    return {
      ...auctionState,
      currentPlayer,
      currentBidderTeam,
      playersRemaining: auctionState.playerQueue.length,
      timeRemaining: auctionState.countdownEndsAt ? 
        Math.max(0, new Date(auctionState.countdownEndsAt).getTime() - Date.now()) : 0,
    };
  },
});

// Get upcoming players in queue
export const getPlayerQueue = query({
  args: {
    auctionId: v.id('auctions'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { auctionId, limit = 10 } = args;
    
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    if (!auctionState) {
      return [];
    }
    
    const queuePlayerIds = auctionState.playerQueue.slice(0, limit);
    const players = await Promise.all(
      queuePlayerIds.map(playerId => ctx.db.get(playerId))
    );
    
    return players.filter(Boolean);
  },
});

// Get bid history for current player
export const getCurrentBidHistory = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    if (!auctionState || !auctionState.bidHistory) {
      return [];
    }
    
    // Get team details for each bid
    const bidHistoryWithTeams = await Promise.all(
      auctionState.bidHistory.map(async (bid) => {
        const team = await ctx.db.get(bid.teamId);
        return {
          ...bid,
          teamName: team?.teamName || 'Unknown Team',
        };
      })
    );
    
    return bidHistoryWithTeams.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },
});

// Get unsold players
export const getUnsoldPlayers = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    if (!auctionState || !auctionState.unsoldPlayers) {
      return [];
    }
    
    const players = await Promise.all(
      auctionState.unsoldPlayers.map(playerId => ctx.db.get(playerId))
    );
    
    return players.filter(Boolean);
  },
});

// Get auction statistics
export const getAuctionStats = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    // Get all players in this auction
    const allPlayers = await ctx.db
      .query('players')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .collect();
    
    const totalPlayers = allPlayers.length;
    const soldPlayers = allPlayers.filter(p => p.isSold).length;
    const unsoldCount = auctionState?.unsoldPlayers?.length || 0;
    const remainingInQueue = auctionState?.playerQueue?.length || 0;
    
    return {
      totalPlayers,
      soldPlayers,
      unsoldPlayers: unsoldCount,
      remainingInQueue,
      currentlyAuctioning: auctionState?.currentPlayerId ? 1 : 0,
      completionPercentage: totalPlayers > 0 ? 
        Math.round(((soldPlayers + unsoldCount) / totalPlayers) * 100) : 0,
    };
  },
});

// Get team bidding capabilities
export const getTeamBiddingInfo = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .collect();
    
    return teams.map(team => ({
      teamId: team._id,
      teamName: team.teamName,
      coinsLeft: team.coinsLeft,
      totalCoins: team.totalCoins,
      playersOwned: team.totalPlayers,
      canBid: team.coinsLeft > 0,
    }));
  },
});

// Check if countdown has expired
export const checkCountdownExpired = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    if (!auctionState || !auctionState.countdownEndsAt) {
      return { expired: false, timeRemaining: 0 };
    }
    
    const now = Date.now();
    const endTime = new Date(auctionState.countdownEndsAt).getTime();
    const timeRemaining = Math.max(0, endTime - now);
    
    return {
      expired: timeRemaining === 0,
      timeRemaining,
      countdownEndsAt: auctionState.countdownEndsAt,
    };
  },
});

// Get real-time auction dashboard data
export const getAuctionDashboard = query({
  args: {
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const { auctionId } = args;
    
    // Get auction state
    const auctionState = await ctx.db
      .query('currentAuctions')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .first();
    
    if (!auctionState) {
      return null;
    }
    
    // Get current player
    let currentPlayer = null;
    if (auctionState.currentPlayerId) {
      currentPlayer = await ctx.db.get(auctionState.currentPlayerId);
    }
    
    // Get next few players
    const nextPlayers = await Promise.all(
      auctionState.playerQueue.slice(0, 5).map(id => ctx.db.get(id))
    );
    
    // Get bid history with team names
    const bidHistory = await Promise.all(
      (auctionState.bidHistory || []).map(async (bid) => {
        const team = await ctx.db.get(bid.teamId);
        return { ...bid, teamName: team?.teamName || 'Unknown' };
      })
    );
    
    // Get team info
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', auctionId))
      .collect();
    
    return {
      status: auctionState.status,
      currentPlayer,
      nextPlayers: nextPlayers.filter(Boolean),
      currentBid: auctionState.currentBid,
      bidHistory: bidHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      timeRemaining: auctionState.countdownEndsAt ? 
        Math.max(0, new Date(auctionState.countdownEndsAt).getTime() - Date.now()) : 0,
      teams: teams.map(team => ({
        teamId: team._id,
        teamName: team.teamName,
        coinsLeft: team.coinsLeft,
        isCurrentBidder: team._id === auctionState.currentBidderTeamId,
      })),
      playersRemaining: auctionState.playerQueue.length,
      unsoldCount: auctionState.unsoldPlayers?.length || 0,
    };
  },
});
