import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createPlayer = mutation({
  args: {
    auctionId: v.id('auctions'),
    teamId: v.optional(v.id('teams')),
    name: v.string(),
    year: v.string(),
    branch: v.union(v.literal('CSE'), v.literal('DSAI'), v.literal('ECE')),
    preference1: v.string(),
    preference2: v.string(),
    preference3: v.string(),
    achievement: v.string(),
    isSold: v.boolean(),
    currentBid: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('players', args);
  },
});

// Get player by ID
export const getPlayer = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

// Get all players in an auction
export const getPlayersByAuction = query({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('players')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', args.auctionId))
      .collect();
  },
});

// Get players by team
export const getPlayersByTeam = query({
  args: { teamId: v.id('teams') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('players')
      .withIndex('by_team_id', (q) => q.eq('teamId', args.teamId))
      .collect();
  },
});

// Get unsold players in an auction
export const getUnsoldPlayers = query({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('players')
      .withIndex('by_is_sold', (q) => q.eq('isSold', false))
      .filter((q) => q.eq(q.field('auctionId'), args.auctionId))
      .collect();
  },
});

// Get sold players in an auction
export const getSoldPlayers = query({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('players')
      .withIndex('by_is_sold', (q) => q.eq('isSold', true))
      .filter((q) => q.eq(q.field('auctionId'), args.auctionId))
      .collect();
  },
});

// Get players by branch
export const getPlayersByBranch = query({
  args: {
    branch: v.union(v.literal('CSE'), v.literal('DSAI'), v.literal('ECE')),
    auctionId: v.id('auctions'),
    soldOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('players')
      .withIndex('by_branch', (q) => q.eq('branch', args.branch))
      .filter((q) => q.eq(q.field('auctionId'), args.auctionId));

    if (args.soldOnly !== undefined) {
      query = query.filter((q) => q.eq(q.field('isSold'), args.soldOnly));
    }

    return await query.collect();
  },
});

// Search players by name
export const searchPlayersByName = query({
  args: {
    searchTerm: v.string(),
    auctionId: v.id('auctions'),
    soldOnly: v.optional(v.boolean()),
    branch: v.optional(
      v.union(v.literal('CSE'), v.literal('DSAI'), v.literal('ECE'))
    ),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query('players')
      .withSearchIndex('search_by_name', (q) => {
        let baseQuery = q
          .search('name', args.searchTerm)
          .eq('auctionId', args.auctionId);

        if (args.soldOnly !== undefined) {
          baseQuery = baseQuery.eq('isSold', args.soldOnly);
        }

        if (args.branch) {
          baseQuery = baseQuery.eq('branch', args.branch);
        }

        return baseQuery;
      });

    return await searchQuery.collect();
  },
});

// Get players by preference
export const getPlayersByPreference = query({
  args: {
    preference: v.string(),
    preferenceType: v.union(v.literal('1'), v.literal('2'), v.literal('3')),
    auctionId: v.id('auctions'),
  },
  handler: async (ctx, args) => {
    const indexName =
      args.preferenceType === '1'
        ? 'by_first_preference'
        : args.preferenceType === '2'
          ? 'by_second_preference'
          : 'by_third_preference';

    const field =
      args.preferenceType === '1'
        ? 'preference1'
        : args.preferenceType === '2'
          ? 'preference2'
          : 'preference3';

    return await ctx.db
      .query('players')
      .withIndex(indexName as any, (q) => q.eq(field as any, args.preference))
      .filter((q) => q.eq(q.field('auctionId'), args.auctionId))
      .collect();
  },
});

// Update player bid
export const updatePlayerBid = mutation({
  args: {
    playerId: v.id('players'),
    currentBid: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error('Player not found');

    if (args.currentBid < 0) {
      throw new Error('Bid cannot be negative');
    }

    return await ctx.db.patch(args.playerId, { currentBid: args.currentBid });
  },
});

// Update player details
export const updatePlayer = mutation({
  args: {
    playerId: v.id('players'),
    name: v.optional(v.string()),
    year: v.optional(v.string()),
    branch: v.optional(
      v.union(v.literal('CSE'), v.literal('DSAI'), v.literal('ECE'))
    ),
    preference1: v.optional(v.string()),
    preference2: v.optional(v.string()),
    preference3: v.optional(v.string()),
    achievement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { playerId, ...updates } = args;
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error('Player not found');

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    return await ctx.db.patch(playerId, cleanUpdates);
  },
});

// Sell player to team (complete transaction)
export const sellPlayerToTeam = mutation({
  args: {
    playerId: v.id('players'),
    teamId: v.id('teams'),
    finalBid: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    const team = await ctx.db.get(args.teamId);

    if (!player) throw new Error('Player not found');
    if (!team) throw new Error('Team not found');
    if (player.isSold) throw new Error('Player already sold');
    if (team.coinsLeft < args.finalBid)
      throw new Error("Team doesn't have enough coins");

    // Update player
    await ctx.db.patch(args.playerId, {
      teamId: args.teamId,
      isSold: true,
      currentBid: args.finalBid,
    });

    // Update team
    const updatedPlayerIds = [...team.playerIds, args.playerId];
    const updatedCoinsLeft = team.coinsLeft - args.finalBid;
    const updatedTotalPlayers = team.totalPlayers + 1;

    await ctx.db.patch(args.teamId, {
      playerIds: updatedPlayerIds,
      coinsLeft: updatedCoinsLeft,
      totalPlayers: updatedTotalPlayers,
    });

    return {
      success: true,
      playerId: args.playerId,
      teamId: args.teamId,
      finalBid: args.finalBid,
    };
  },
});

// Delete player
export const deletePlayer = mutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error('Player not found');

    return await ctx.db.delete(args.playerId);
  },
});
