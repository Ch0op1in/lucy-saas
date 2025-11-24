import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  portfolio: defineTable({
    coinId: v.string(),
    amount: v.number(),
    investedEur: v.optional(v.number()),
    timestamp: v.number(),
  }),
  tokenPrices: defineTable({
    symbol: v.string(),
    price: v.number(),
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),
  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    severity: v.optional(
      v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("critical")),
    ),
    assetSymbol: v.optional(v.string()),
    priceTarget: v.optional(v.number()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});

