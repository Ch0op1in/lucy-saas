import { v } from "convex/values"

import { internal } from "../../_generated/api"
import { internalMutation, type MutationCtx } from "../../_generated/server"
import { buildPortfolioInsights } from "../lib/portfolio"

export const SUPPORTED_ASSETS = [
  { coinId: "bitcoin", symbol: "BTC", market: "BTCEUR" },
  { coinId: "ethereum", symbol: "ETH", market: "ETHEUR" },
  { coinId: "solana", symbol: "SOL", market: "SOLEUR" },
]

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

type RuleOperator = "above" | "below"

const shouldTriggerRule = (
  operator: RuleOperator,
  target: number,
  previousPrice: number | null,
  nextPrice: number,
) => {
  if (operator === "above") {
    if (nextPrice < target) return false
    if (previousPrice === null) return true
    return previousPrice < target
  }

  if (nextPrice > target) return false
  if (previousPrice === null) return true
  return previousPrice > target
}

const severityByOperator: Record<RuleOperator, "info" | "warning"> = {
  above: "warning",
  below: "info",
}

const comparatorByOperator: Record<RuleOperator, ">" | "<"> = {
  above: ">",
  below: "<",
}

const directionByOperator: Record<RuleOperator, string> = {
  above: "au-dessus",
  below: "en dessous",
}

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
      .unique()

    const previousPrice = existing?.price ?? null

    if (existing) {
      await ctx.db.patch(existing._id, {
        price: args.price,
        updatedAt: args.updatedAt,
      })
    } else {
      await ctx.db.insert("tokenPrices", {
        symbol: args.symbol,
        price: args.price,
        updatedAt: args.updatedAt,
      })
    }

    await triggerRulesForSymbol(ctx, {
      symbol: args.symbol,
      currentPrice: args.price,
      previousPrice,
      updatedAt: args.updatedAt,
    })
  },
})

const triggerRulesForSymbol = async (
  ctx: MutationCtx,
  params: {
    symbol: string
    currentPrice: number
    previousPrice: number | null
    updatedAt: number
  },
) => {
  const rules = await ctx.db
    .query("alertRules")
    .withIndex("by_assetSymbol", (q) => q.eq("assetSymbol", params.symbol))
    .collect()

  if (rules.length === 0) {
    return
  }

  const triggeredRules = rules.filter((rule) =>
    shouldTriggerRule(
      rule.operator as RuleOperator,
      rule.priceTarget,
      params.previousPrice,
      params.currentPrice,
    ),
  )

  if (triggeredRules.length === 0) {
    return
  }

  const insights = await buildPortfolioInsights(ctx, {
    symbol: params.symbol,
    currentPrice: params.currentPrice,
  })

  await Promise.all(
    triggeredRules.map(async (rule) => {
      const operator = rule.operator as RuleOperator
      const severity = severityByOperator[operator]
      const comparator = comparatorByOperator[operator]
      const direction = directionByOperator[operator]
      const formattedTarget = euroFormatter.format(rule.priceTarget)
      const formattedPrice = euroFormatter.format(params.currentPrice)
      const baseMessage = `${rule.assetSymbol} est désormais ${direction} du seuil ${formattedTarget} (prix actuel ${formattedPrice}).`

      console.log("[notifications] scheduling AI generation", {
        symbol: rule.assetSymbol,
        priceTarget: rule.priceTarget,
        currentPrice: params.currentPrice,
      })

      await ctx.scheduler.runAfter(0, internal.ai.generateNotification, {
        title: `${rule.assetSymbol} ${comparator} ${formattedTarget}`,
        baseMessage,
        portfolioSummary: {
          description: insights.hasPosition
            ? `Vous détenez ${insights.amount.toLocaleString("fr-FR", {
                maximumFractionDigits: 6,
              })} ${params.symbol} (~${euroFormatter.format(insights.value)}), soit ${
                insights.allocationPct > 0
                  ? `${insights.allocationPct.toFixed(1)} %`
                  : "moins de 1 %"
              } de votre allocation.`
            : `Vous ne détenez pas ${params.symbol}.`,
        },
        severity,
        assetSymbol: rule.assetSymbol,
        priceTarget: rule.priceTarget,
        createdAt: params.updatedAt,
      })
    }),
  )
}


