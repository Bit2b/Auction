// ===== TEAMS MUTATIONS AND QUERIES (teams.ts) =====
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get all teams
export const getAllTeams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('teams').collect();
  },
});

// Get team by ID
export const getTeamById = query({
  args: { teamId: v.id('teams') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

// Get teams by auction ID
export const getTeamsByAuction = query({
  args: { auctionId: v.id('auctions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('teams')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', args.auctionId))
      .collect();
  },
});

// Get teams by owner
export const getTeamsByOwner = query({
  args: { owner: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('teams')
      .withIndex('by_owner', (q) => q.eq('owner', args.owner))
      .collect();
  },
});

// Get team by name
export const getTeamByName = query({
  args: { teamName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('teams')
      .withIndex('by_team_name', (q) => q.eq('teamName', args.teamName))
      .first();
  },
});

// Create a new team
export const createTeam = mutation({
  args: {
    auctionId: v.id('auctions'),
    teamName: v.string(),
    owner: v.string(),
    totalCoins: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if team name already exists in this auction
    const existingTeam = await ctx.db
      .query('teams')
      .withIndex('by_auction_id', (q) => q.eq('auctionId', args.auctionId))
      .filter((q) => q.eq(q.field('teamName'), args.teamName))
      .first();

    if (existingTeam) {
      throw new Error(`Team name "${args.teamName}" already exists in this auction`);
    }

    const teamId = await ctx.db.insert('teams', {
      auctionId: args.auctionId,
      teamName: args.teamName,
      owner: args.owner,
      coinsLeft: args.totalCoins,
      totalCoins: args.totalCoins,
      totalPlayers: 0,
      playerIds: [],
    });

    return { teamId, success: true };
  },
});

// Update team details
export const updateTeam = mutation({
  args: {
    teamId: v.id('teams'),
    teamName: v.optional(v.string()),
    owner: v.optional(v.string()),
    coinsLeft: v.optional(v.number()),
    totalCoins: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { teamId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No updates provided');
    }

    // If updating team name, check for duplicates in the same auction
    if (updates.teamName) {
      const team = await ctx.db.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const existingTeam = await ctx.db
        .query('teams')
        .withIndex('by_auction_id', (q) => q.eq('auctionId', team.auctionId))
        .filter((q) => q.eq(q.field('teamName'), updates.teamName!))
        .first();

      if (existingTeam && existingTeam._id !== teamId) {
        throw new Error(`Team name "${updates.teamName}" already exists in this auction`);
      }
    }

    // Validate coins
    if (updates.coinsLeft !== undefined && updates.coinsLeft < 0) {
      throw new Error('Coins left cannot be negative');
    }

    if (updates.totalCoins !== undefined && updates.totalCoins <= 0) {
      throw new Error('Total coins must be positive');
    }

    await ctx.db.patch(teamId, cleanUpdates);
    return { success: true };
  },
});

// Add player to team
export const addPlayerToTeam = mutation({
  args: {
    teamId: v.id('teams'),
    playerId: v.string(),
    playerCost: v.number(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if player is already in the team
    if (team.playerIds.includes(args.playerId)) {
      throw new Error('Player is already in this team');
    }

    // Check if team has enough coins
    if (team.coinsLeft < args.playerCost) {
      throw new Error(`Insufficient coins. Team has ${team.coinsLeft} coins left, but player costs ${args.playerCost}`);
    }

    const updatedPlayerIds = [...team.playerIds, args.playerId];
    const updatedCoinsLeft = team.coinsLeft - args.playerCost;
    const updatedTotalPlayers = team.totalPlayers + 1;

    await ctx.db.patch(args.teamId, {
      playerIds: updatedPlayerIds,
      coinsLeft: updatedCoinsLeft,
      totalPlayers: updatedTotalPlayers,
    });

    return { success: true, coinsLeft: updatedCoinsLeft };
  },
});

// Remove player from team
export const removePlayerFromTeam = mutation({
  args: {
    teamId: v.id('teams'),
    playerId: v.string(),
    playerCost: v.number(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if player is in the team
    const playerIndex = team.playerIds.indexOf(args.playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found in this team');
    }

    const updatedPlayerIds = [...team.playerIds];
    updatedPlayerIds.splice(playerIndex, 1);
    
    const updatedCoinsLeft = team.coinsLeft + args.playerCost;
    const updatedTotalPlayers = team.totalPlayers - 1;

    await ctx.db.patch(args.teamId, {
      playerIds: updatedPlayerIds,
      coinsLeft: updatedCoinsLeft,
      totalPlayers: updatedTotalPlayers,
    });

    return { success: true, coinsLeft: updatedCoinsLeft };
  },
});

// Update team coins (for manual adjustments)
export const updateTeamCoins = mutation({
  args: {
    teamId: v.id('teams'),
    coinsLeft: v.number(),
    totalCoins: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (args.coinsLeft < 0) {
      throw new Error('Coins left cannot be negative');
    }

    const updates: any = { coinsLeft: args.coinsLeft };
    
    if (args.totalCoins !== undefined) {
      if (args.totalCoins <= 0) {
        throw new Error('Total coins must be positive');
      }
      updates.totalCoins = args.totalCoins;
    }

    await ctx.db.patch(args.teamId, updates);
    return { success: true };
  },
});

// Delete team
export const deleteTeam = mutation({
  args: { teamId: v.id('teams') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.teamId);
    return { success: true };
  },
});


// Transfer player between teams
export const transferPlayer = mutation({
  args: {
    fromTeamId: v.id('teams'),
    toTeamId: v.id('teams'),
    playerId: v.string(),
    playerCost: v.number(),
  },
  handler: async (ctx, args) => {
    const fromTeam = await ctx.db.get(args.fromTeamId);
    const toTeam = await ctx.db.get(args.toTeamId);

    if (!fromTeam) throw new Error('Source team not found');
    if (!toTeam) throw new Error('Destination team not found');

    // Check if player is in source team
    if (!fromTeam.playerIds.includes(args.playerId)) {
      throw new Error('Player not found in source team');
    }

    // Check if player is already in destination team
    if (toTeam.playerIds.includes(args.playerId)) {
      throw new Error('Player is already in destination team');
    }

    // Check if destination team has enough coins
    if (toTeam.coinsLeft < args.playerCost) {
      throw new Error(`Destination team has insufficient coins`);
    }

    // Remove from source team
    const fromPlayerIds = fromTeam.playerIds.filter(id => id !== args.playerId);
    await ctx.db.patch(args.fromTeamId, {
      playerIds: fromPlayerIds,
      coinsLeft: fromTeam.coinsLeft + args.playerCost,
      totalPlayers: fromTeam.totalPlayers - 1,
    });

    // Add to destination team
    const toPlayerIds = [...toTeam.playerIds, args.playerId];
    await ctx.db.patch(args.toTeamId, {
      playerIds: toPlayerIds,
      coinsLeft: toTeam.coinsLeft - args.playerCost,
      totalPlayers: toTeam.totalPlayers + 1,
    });

    return { success: true };
  },
});