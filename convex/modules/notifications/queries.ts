import { query } from "../../_generated/server"
import { v } from "convex/values"

import { MAX_NOTIFICATIONS } from "./constants"

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 25, MAX_NOTIFICATIONS)

    return await ctx.db
      .query("notifications")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit)
  },
})

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect()

    return unread.length
  },
})


