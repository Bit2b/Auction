import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('by_user_id', ['userId']),

  auctions: defineTable({
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
  })
    .index('by_status', ['status'])
    .index('by_auctioneer', ['auctioneer'])
    .index('by_auction_name', ['auctionName']),

  teams: defineTable({
    auctionId: v.id('auctions'),
    teamName: v.string(),
    ownerId: v.string(),
    coinsLeft: v.number(),
    totalCoins: v.number(),
    totalPlayers: v.number(),
    playerIds: v.array(v.id('players')),
  })
    .index('by_auction_id', ['auctionId'])
    .index('by_team_name', ['teamName'])
    .index('by_owner_id', ['ownerId']),

  players: defineTable({
    userId: v.string(),
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
  })
    .index('by_auction_id', ['auctionId'])
    .index('by_branch', ['branch'])
    .index('by_team_id', ['teamId'])
    .index('by_is_sold', ['isSold'])
    .index('by_first_preference', ['preference1'])
    .index('by_second_preference', ['preference2'])
    .index('by_third_preference', ['preference3'])
    .searchIndex('search_by_name', {
      searchField: 'name',
      filterFields: ['auctionId', 'teamId', 'isSold', 'branch'],
    }),
});
