import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ==================== TEAM FUNCTIONS ====================

// Create a new team
export const createTeam = mutation({
  args: {
    auctionId: v.id("auctions"),
    teamName: v.string(),
    owner: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if team name already exists in this auction
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_team_name", (q) => q.eq("teamName", args.teamName))
      .filter((q) => q.eq(q.field("auctionId"), args.auctionId))
      .first();

    if (existingTeam) {
      throw new Error("Team name already exists in this auction");
    }

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) throw new Error("Auction not found");

    return await ctx.db.insert("teams", {
      auctionId: args.auctionId,
      teamName: args.teamName,
      owner: args.owner,
      coinsLeft: auction.startingCoin,
      totalCoins: auction.startingCoin,
      totalPlayers: 0,
      playerIds: [],
    });
  },
});

// Get team by ID
export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

// Get all teams in an auction
export const getTeamsByAuction = query({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_auction_id", (q) => q.eq("auctionId", args.auctionId))
      .collect();
  },
});

// Get team by owner
export const getTeamByOwner = query({
  args: { 
    owner: v.string(),
    auctionId: v.optional(v.id("auctions"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("teams")
      .withIndex("by_owner", (q) => q.eq("owner", args.owner));
    
    if (args.auctionId) {
      query = query.filter((q) => q.eq(q.field("auctionId"), args.auctionId));
    }
    
    return await query.collect();
  },
});

// Get team by name
export const getTeamByName = query({
  args: { 
    teamName: v.string(),
    auctionId: v.optional(v.id("auctions"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("teams")
      .withIndex("by_team_name", (q) => q.eq("teamName", args.teamName));
    
    if (args.auctionId) {
      query = query.filter((q) => q.eq(q.field("auctionId"), args.auctionId));
    }
    
    return await query.first();
  },
});

// Update team coins
export const updateTeamCoins = mutation({
  args: {
    teamId: v.id("teams"),
    coinsLeft: v.number(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    if (args.coinsLeft < 0) {
      throw new Error("Team cannot have negative coins");
    }

    return await ctx.db.patch(args.teamId, { coinsLeft: args.coinsLeft });
  },
});

// Add player to team (update playerIds array)
export const addPlayerToTeam = mutation({
  args: {
    teamId: v.id("teams"),
    playerId: v.id("players"), // Changed from v.string() to v.id("players")
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if player already in team
    if (team.playerIds.includes(args.playerId)) {
      throw new Error("Player already in team");
    }

    const updatedPlayerIds = [...team.playerIds, args.playerId];
    const updatedTotalPlayers = team.totalPlayers + 1;

    return await ctx.db.patch(args.teamId, {
      playerIds: updatedPlayerIds,
      totalPlayers: updatedTotalPlayers,
    });
  },
});

// Remove player from team
export const removePlayerFromTeam = mutation({
  args: {
    teamId: v.id("teams"),
    playerId: v.id("players"), // Changed from v.string() to v.id("players")
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const updatedPlayerIds = team.playerIds.filter(id => id !== args.playerId);
    const updatedTotalPlayers = Math.max(0, team.totalPlayers - 1);

    return await ctx.db.patch(args.teamId, {
      playerIds: updatedPlayerIds,
      totalPlayers: updatedTotalPlayers,
    });
  },
});

// Update team name
export const updateTeamName = mutation({
  args: {
    teamId: v.id("teams"),
    teamName: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if new name already exists in the same auction
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_team_name", (q) => q.eq("teamName", args.teamName))
      .filter((q) => q.eq(q.field("auctionId"), team.auctionId))
      .first();

    if (existingTeam && existingTeam._id !== args.teamId) {
      throw new Error("Team name already exists in this auction");
    }

    return await ctx.db.patch(args.teamId, { teamName: args.teamName });
  },
});

// Delete team
export const deleteTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // First, update all players to remove team association
    const players = await ctx.db
      .query("players")
      .withIndex("by_team_id", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const player of players) {
      await ctx.db.patch(player._id, {
        teamId: undefined,
        isSold: false,
        currentBid: undefined,
      });
    }

    return await ctx.db.delete(args.teamId);
  },
});

// Get team statistics
export const getTeamStats = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const players = await ctx.db
      .query("players")
      .withIndex("by_team_id", (q) => q.eq("teamId", args.teamId))
      .collect();

    const totalSpent = team.totalCoins - team.coinsLeft;
    const averagePlayerCost = team.totalPlayers > 0 ? totalSpent / team.totalPlayers : 0;

    return {
      teamId: args.teamId,
      teamName: team.teamName,
      totalPlayers: team.totalPlayers,
      totalCoins: team.totalCoins,
      coinsLeft: team.coinsLeft,
      totalSpent,
      averagePlayerCost,
      players: players.map(p => ({
        playerId: p._id,
        name: p.name,
        branch: p.branch,
        currentBid: p.currentBid || 0,
      })),
    };
  },
});