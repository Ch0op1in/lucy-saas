import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_NOTIFICATIONS = 100;

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 25, MAX_NOTIFICATIONS);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);

    return notifications;
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unread.length;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true }),
      ),
    );

    return unread.length;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    severity: v.optional(
      v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("critical")),
    ),
    assetSymbol: v.optional(v.string()),
    priceTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      title: args.title,
      message: args.message,
      severity: args.severity ?? "info",
      assetSymbol: args.assetSymbol,
      priceTarget: args.priceTarget,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});


