import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Create Auction
export const createAuction = mutation({
  args: {
    auctionName: v.string(),
    teams: v.array(v.string()),
    teamRequests: v.array(v.string()),
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
    await ctx.db.patch(args.id, { status: args.status });
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
  args: { id: v.id('auctions'), teamId: v.string() },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.id);
    if (!auction) throw new Error('Auction not found');
    await ctx.db.patch(args.id, {
      teamRequests: [...auction.teamRequests, args.teamId],
    });
  },
});

// Remove Team Request
export const removeTeamRequest = mutation({
  args: { id: v.id('auctions'), teamId: v.string() },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.id);
    if (!auction) throw new Error('Auction not found');
    await ctx.db.patch(args.id, {
      teamRequests: auction.teamRequests.filter((t) => t !== args.teamId),
    });
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
    teams: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal('registering'),
      v.literal('live'),
      v.literal('ended'),
      v.literal('idle')
    )),
    startingCoin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { auctionId, ...updates } = args;
    
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
    
    await ctx.db.patch(auctionId, cleanUpdates);
    return { success: true };
  },
});