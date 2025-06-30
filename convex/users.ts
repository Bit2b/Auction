import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createOrUpdateUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
    } else {
      await ctx.db.insert('users', {
        userId: args.userId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
    }
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get the current user's identity from Clerk
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Find the user in your users table by userId (Clerk's user ID)
    const user = await ctx.db
      .query('users')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    return user;
  },
});

export const getUserById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();

    return user;
  },
});
