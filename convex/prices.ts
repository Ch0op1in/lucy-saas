import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const SUPPORTED_ASSETS = [
  { coinId: "bitcoin", symbol: "BTC", market: "BTCEUR" },
  { coinId: "ethereum", symbol: "ETH", market: "ETHEUR" },
  { coinId: "solana", symbol: "SOL", market: "SOLEUR" },
];

export const upsertPrice = internalMutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokenPrices")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        price: args.price,
        updatedAt: args.updatedAt,
      });
      return;
    }

    await ctx.db.insert("tokenPrices", {
      symbol: args.symbol,
      price: args.price,
      updatedAt: args.updatedAt,
    });
  },
});

