import { mutation } from "../../_generated/server"
import { v } from "convex/values"

import { SUPPORTED_ASSETS } from "../lib/constants"

const SUPPORTED_SYMBOLS = new Set(SUPPORTED_ASSETS.map((asset) => asset.symbol.toUpperCase()))

export const create = mutation({
  args: {
    assetSymbol: v.string(),
    operator: v.union(v.literal("above"), v.literal("below")),
    priceTarget: v.number(),
  },
  handler: async (ctx, args) => {
    const symbol = args.assetSymbol.trim().toUpperCase()
    if (!SUPPORTED_SYMBOLS.has(symbol)) {
      throw new Error("Actif non supporté")
    }
    if (!Number.isFinite(args.priceTarget) || args.priceTarget <= 0) {
      throw new Error("Le seuil doit être un montant positif.")
    }

    const now = Date.now()

    return await ctx.db.insert("alertRules", {
      assetSymbol: symbol,
      operator: args.operator,
      priceTarget: args.priceTarget,
      createdAt: now,
    })
  },
})


