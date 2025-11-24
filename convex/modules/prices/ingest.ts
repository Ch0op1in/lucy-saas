import { v } from "convex/values"

import { internal } from "../../_generated/api"
import { internalMutation, mutation, type MutationCtx } from "../../_generated/server"
import { SUPPORTED_ASSETS } from "../lib/constants"
import { buildPortfolioInsights } from "../lib/portfolio"

export { SUPPORTED_ASSETS }

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

const updatePriceAndTriggerRules = async (
  ctx: MutationCtx,
  params: {
    symbol: string
    price: number
    updatedAt: number
  },
) => {
  console.log("[prices] updatePriceAndTriggerRules called", {
    symbol: params.symbol,
    price: params.price,
  })

  const existing = await ctx.db
    .query("tokenPrices")
    .withIndex("by_symbol", (q) => q.eq("symbol", params.symbol))
    .unique()

  const previousPrice = existing?.price ?? null

  if (existing) {
    await ctx.db.patch(existing._id, {
      price: params.price,
      updatedAt: params.updatedAt,
    })
  } else {
    await ctx.db.insert("tokenPrices", {
      symbol: params.symbol,
      price: params.price,
      updatedAt: params.updatedAt,
    })
  }

  await triggerRulesForSymbol(ctx, {
    symbol: params.symbol,
    currentPrice: params.price,
    previousPrice,
    updatedAt: params.updatedAt,
  })
}

export const upsertPrice = internalMutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await updatePriceAndTriggerRules(ctx, {
      symbol: args.symbol,
      price: args.price,
      updatedAt: args.updatedAt,
    })
  },
})

export const updatePrice = mutation({
  args: {
    symbol: v.string(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const symbol = args.symbol.trim().toUpperCase()
    if (!SUPPORTED_ASSETS.some((asset) => asset.symbol === symbol)) {
      throw new Error("Actif non supporté")
    }
    if (!Number.isFinite(args.price) || args.price <= 0) {
      throw new Error("Le prix doit être un montant positif.")
    }

    await updatePriceAndTriggerRules(ctx, {
      symbol,
      price: args.price,
      updatedAt: Date.now(),
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
  console.log("[prices] Checking rules for symbol", {
    symbol: params.symbol,
    currentPrice: params.currentPrice,
    previousPrice: params.previousPrice,
  })

  const rules = await ctx.db
    .query("alertRules")
    .withIndex("by_assetSymbol", (q) => q.eq("assetSymbol", params.symbol))
    .collect()

  console.log("[prices] Found rules", { symbol: params.symbol, count: rules.length })

  if (rules.length === 0) {
    return
  }

  const triggeredRules = rules.filter((rule) => {
    const shouldTrigger = shouldTriggerRule(
      rule.operator as RuleOperator,
      rule.priceTarget,
      params.previousPrice,
      params.currentPrice,
    )
    
    console.log("[prices] Rule check", {
      symbol: params.symbol,
      ruleId: rule._id,
      operator: rule.operator,
      target: rule.priceTarget,
      previousPrice: params.previousPrice,
      currentPrice: params.currentPrice,
      shouldTrigger,
    })
    
    return shouldTrigger
  })

  console.log("[prices] Triggered rules", {
    symbol: params.symbol,
    total: rules.length,
    triggered: triggeredRules.length,
  })

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


