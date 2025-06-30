import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Create Auction
export const createAuction = mutation({
  args: {
    auctionName: v.string(),
    teams: v.array(v.id('teams')),
    teamRequests: v.array(v.id('teams')),
    starting: v.string(),
    ending: v.string(),
    auctioneer: v.string(),
    startingCoin: v.number(),
    status: v.union(
      v.literal('registering'),
      v.literal('live'),
      v.literal('ended'),
      v.literal('idle')
    ),
  },
  handler: async (ctx, args) => {
    // Validate dates
    const startDate = new Date(args.starting);
    const endDate = new Date(args.ending);
    if (startDate >= endDate) {
      throw new Error('End time must be after start time');
    }

    // Check if auction name already exists
    const existingAuction = await ctx.db
      .query('auctions')
      .withIndex('by_auction_name', (q) =>
        q.eq('auctionName', args.auctionName)
      )
      .first();

    if (existingAuction) {
      throw new Error('Auction name already exists');
    }

    return await ctx.db.insert('auctions', args);
  },
});

// Get All Auctions
export const getAllAuctions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('auctions').collect();
  },
});

// Get Auctions by Status
export const getAuctionsByStatus = query({
  args: {
    status: v.union(
      v.literal('registering'),
      v.literal('live'),
      v.literal('ended'),
      v.literal('idle')
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('auctions')
      .withIndex('by_status', (q) => q.eq('status', args.status))
      .collect();
  },
});

// Get Auction Status
export const getAuctionStatus = query({
  args: { id: v.id('auctions') },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.id);
    if (!auction) throw new Error('Auction not found');
    return { status: auction.status };
  },
});

// Update Auction Status
export const updateAuctionStatus = mutation({
  args: {
    id: v.id('auctions'),
    status: v.union(
      v.literal('registering'),
      v.literal('live'),
      v.literal('ended'),
      v.literal('idle')
    ),
  },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.id);
    if (!auction) throw new Error('Auction not found');

    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

// Get Auctions by Auctioneer
export const getAuctionsByAuctioneer = query({
  args: { auctioneer: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('auctions')
      .withIndex('by_auctioneer', (q) => q.eq('auctioneer', args.auctioneer))
      .collect();
  },
});

// Get Auction by Name
export const getAuctionByName = query({
  args: { auctionName: v.string() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('auctions')
      .withIndex('by_auction_name', (q) =>
        q.eq('auctionName', args.auctionName)
      )
      .unique();
    return result;
  },
});

// Add Team Request
export const addTeamRequest = mutation({
  args: {
    id: v.id('auctions'),
    teamId: v.id('teams'), // Changed from v.string()
  },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.id);
    if (!auction) throw new Error('Auction not found');

    // Check if team request already exists
    if (auction.teamRequests.includes(args.teamId)) {
      throw new Error('Team request already exists');
    }

    // Verify team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error('Team not found');

    await ctx.db.patch(args.id, {
      teamRequests: [...auction.teamRequests, args.teamId],
    });

    return { success: true };
  },
});

// Remove Team Request
export const removeTeamRequest = mutation({
  args: {
    id: v.id('auctions'),
    teamId: v.id('teams'), // Changed from v.string()
  },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.id);
    if (!auction) throw new Error('Auction not found');

    await ctx.db.patch(args.id, {
      teamRequests: auction.teamRequests.filter((t) => t !== args.teamId),
    });

    return { success: true };
  },
});

// Accept Team Request (move from requests to teams)
export const acceptTeamRequest = mutation({
  args: {
    auctionId: v.id('auctions'),
    teamId: v.id('teams'),
  },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) throw new Error('Auction not found');

    // Check if team is in requests
    if (!auction.teamRequests.includes(args.teamId)) {
      throw new Error('Team request not found');
    }

    // Check if team is already accepted
    if (auction.teams.includes(args.teamId)) {
      throw new Error('Team already accepted');
    }

    // Move team from requests to teams
    const updatedRequests = auction.teamRequests.filter(
      (t) => t !== args.teamId
    );
    const updatedTeams = [...auction.teams, args.teamId];

    await ctx.db.patch(args.auctionId, {
      teamRequests: updatedRequests,
      teams: updatedTeams,
    });

    return { success: true };
  },
});

// Remove Team from Auction
export const removeTeamFromAuction = mutation({
  args: {
    auctionId: v.id('auctions'),
    teamId: v.id('teams'),
  },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) throw new Error('Auction not found');

    await ctx.db.patch(args.auctionId, {
      teams: auction.teams.filter((t) => t !== args.teamId),
    });

    return { success: true };
  },
});

// Get Auction by ID
export const getAuctionById = query({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.auctionId);
  },
});

// Delete Auction
export const deleteAuction = mutation({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    // First, delete all associated teams and players
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', args.auctionId))
      .collect();

    for (const team of teams) {
      // Delete all players in the team
      const players = await ctx.db
        .query('players')
        .withIndex('by_team_id', (q) => q.eq('teamId', team._id))
        .collect();

      for (const player of players) {
        await ctx.db.delete(player._id);
      }

      // Delete the team
      await ctx.db.delete(team._id);
    }

    // Delete players not associated with teams but in this auction
    const unassignedPlayers = await ctx.db
      .query('players')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', args.auctionId))
      .collect();

    for (const player of unassignedPlayers) {
      await ctx.db.delete(player._id);
    }

    // Finally, delete the auction
    await ctx.db.delete(args.auctionId);
    return { success: true };
  },
});

// Update Auction Details
export const updateAuction = mutation({
  args: {
    auctionId: v.id('auctions'),
    auctionName: v.optional(v.string()),
    starting: v.optional(v.string()),
    ending: v.optional(v.string()),
    teams: v.optional(v.array(v.id('teams'))), // Changed from v.array(v.string())
    status: v.optional(
      v.union(
        v.literal('registering'),
        v.literal('live'),
        v.literal('ended'),
        v.literal('idle')
      )
    ),
    startingCoin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { auctionId, ...updates } = args;

    const auction = await ctx.db.get(auctionId);
    if (!auction) throw new Error('Auction not found');

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No updates provided');
    }

    // Validate dates if provided
    if (updates.starting && updates.ending) {
      const startDate = new Date(updates.starting);
      const endDate = new Date(updates.ending);
      if (startDate >= endDate) {
        throw new Error('End time must be after start time');
      }
    }

    // Check if auction name already exists (if updating name)
    if (updates.auctionName && updates.auctionName !== auction.auctionName) {
      const existingAuction = await ctx.db
        .query('auctions')
        .withIndex('by_auction_name', (q) =>
          q.eq('auctionName', updates.auctionName ?? 'no_name')
        )
        .first();

      if (existingAuction) {
        throw new Error('Auction name already exists');
      }
    }

    await ctx.db.patch(auctionId, cleanUpdates);
    return { success: true };
  },
});

// Get Auction with Team Details
export const getAuctionWithTeams = query({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) return null;

    // Get team details
    const teamDetails = await Promise.all(
      auction.teams.map(async (teamId) => {
        const team = await ctx.db.get(teamId);
        return team;
      })
    );

    // Get team request details
    const teamRequestDetails = await Promise.all(
      auction.teamRequests.map(async (teamId) => {
        const team = await ctx.db.get(teamId);
        return team;
      })
    );

    return {
      ...auction,
      teamDetails: teamDetails.filter(Boolean),
      teamRequestDetails: teamRequestDetails.filter(Boolean),
    };
  },
});

// Get user's team registration for specific auction
export const getUserTeamRegistration = query({
  args: {
    auctionId: v.id('auctions'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user owns any team in this auction
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) return null;

    // Get all teams in the auction
    const teams = await Promise.all(
      auction.teams.map(async (teamId) => {
        return await ctx.db.get(teamId);
      })
    );

    // Find team owned by this user
    const userTeam = teams.find((team) => team?.ownerId === args.userId);
    return userTeam || null;
  },
});

// Get user's player registration for specific auction
export const getUserPlayerRegistration = query({
  args: {
    auctionId: v.id('auctions'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is registered as a player in this auction
    return await ctx.db
      .query('players')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', args.auctionId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();
  },
});
