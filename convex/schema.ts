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
});

