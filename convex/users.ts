import { mutation } from './_generated/server';
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
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
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
