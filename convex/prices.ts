import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

export const SUPPORTED_ASSETS = [
  { coinId: "bitcoin", symbol: "BTC", market: "BTCEUR" },
  { coinId: "ethereum", symbol: "ETH", market: "ETHEUR" },
  { coinId: "solana", symbol: "SOL", market: "SOLEUR" },
];

const symbolByCoinId = SUPPORTED_ASSETS.reduce<Record<string, string>>(
  (acc, asset) => {
    acc[asset.coinId] = asset.symbol;
    return acc;
  },
  {},
);

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type RuleOperator = "above" | "below";
const shouldTriggerRule = (
  operator: RuleOperator,
  target: number,
  previousPrice: number | null,
  nextPrice: number,
) => {
  if (operator === "above") {
    if (nextPrice < target) return false;
    if (previousPrice === null) return true;
    return previousPrice < target;
  }

  if (nextPrice > target) return false;
  if (previousPrice === null) return true;
  return previousPrice > target;
};

const severityByOperator: Record<RuleOperator, "info" | "warning"> = {
  above: "warning",
  below: "info",
};

const comparatorByOperator: Record<RuleOperator, ">" | "<"> = {
  above: ">",
  below: "<",
};

const directionByOperator: Record<RuleOperator, string> = {
  above: "au-dessus",
  below: "en dessous",
};

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

    const previousPrice = existing?.price ?? null;

    if (existing) {
      await ctx.db.patch(existing._id, {
        price: args.price,
        updatedAt: args.updatedAt,
      });
    } else {
      await ctx.db.insert("tokenPrices", {
        symbol: args.symbol,
        price: args.price,
        updatedAt: args.updatedAt,
      });
    }

    await triggerRulesForSymbol(ctx, {
      symbol: args.symbol,
      currentPrice: args.price,
      previousPrice,
      updatedAt: args.updatedAt,
    });
  },
});

const triggerRulesForSymbol = async (
  ctx: MutationCtx,
  params: {
    symbol: string;
    currentPrice: number;
    previousPrice: number | null;
    updatedAt: number;
  },
) => {
  const rules = await ctx.db
    .query("alertRules")
    .withIndex("by_assetSymbol", (q) => q.eq("assetSymbol", params.symbol))
    .collect();

  if (rules.length === 0) {
    return;
  }

  const triggeredRules = rules.filter((rule) =>
    shouldTriggerRule(
      rule.operator as RuleOperator,
      rule.priceTarget,
      params.previousPrice,
      params.currentPrice,
    ),
  );

  if (triggeredRules.length === 0) {
    return;
  }

  const insights = await buildPortfolioInsights(ctx, {
    symbol: params.symbol,
    currentPrice: params.currentPrice,
  });

  const portfolioSummary = buildPortfolioSummary({
    symbol: params.symbol,
    insights,
  });

  await Promise.all(
    triggeredRules.map(async (rule) => {
      const operator = rule.operator as RuleOperator;
      const severity = severityByOperator[operator];
      const comparator = comparatorByOperator[operator];
      const direction = directionByOperator[operator];
      const formattedTarget = euroFormatter.format(rule.priceTarget);
      const formattedPrice = euroFormatter.format(params.currentPrice);
      const baseMessage = `${rule.assetSymbol} est désormais ${direction} du seuil ${formattedTarget} (prix actuel ${formattedPrice}).`;

      console.log("[notifications] scheduling AI generation", {
        symbol: rule.assetSymbol,
        priceTarget: rule.priceTarget,
        currentPrice: params.currentPrice,
      });

      await ctx.scheduler.runAfter(0, internal.ai.generateNotification, {
        title: `${rule.assetSymbol} ${comparator} ${formattedTarget}`,
        baseMessage,
        portfolioSummary,
        severity,
        assetSymbol: rule.assetSymbol,
        priceTarget: rule.priceTarget,
        createdAt: params.updatedAt,
      });
    }),
  );
};

type PortfolioInsights = {
  hasPosition: boolean;
  amount: number;
  value: number;
  allocationPct: number;
  totalValue: number;
};

const buildPortfolioInsights = async (
  ctx: MutationCtx,
  params: { symbol: string; currentPrice: number },
): Promise<PortfolioInsights> => {
  const [portfolioEntries, priceDocs] = await Promise.all([
    ctx.db.query("portfolio").collect(),
    ctx.db.query("tokenPrices").collect(),
  ]);

  const priceBySymbol = new Map(priceDocs.map((doc) => [doc.symbol, doc.price]));
  priceBySymbol.set(params.symbol, params.currentPrice);

  const holdings = new Map<
    string,
    {
      amount: number;
      ids: Id<"portfolio">[];
    }
  >();

  for (const entry of portfolioEntries) {
    const symbol = symbolByCoinId[entry.coinId] ?? entry.coinId.toUpperCase();
    const aggregate = holdings.get(symbol) ?? { amount: 0, ids: [] };
    aggregate.amount += entry.amount;
    aggregate.ids.push(entry._id);
    holdings.set(symbol, aggregate);
  }

  let totalValue = 0;
  for (const [symbol, aggregate] of holdings) {
    const referencePrice =
      symbol === params.symbol ? params.currentPrice : priceBySymbol.get(symbol) ?? 0;
    totalValue += aggregate.amount * referencePrice;
  }

  const assetHolding = holdings.get(params.symbol);
  const assetAmount = assetHolding?.amount ?? 0;
  const assetValue = assetAmount * params.currentPrice;
  const allocationPct =
    totalValue > 0 && assetValue > 0 ? (assetValue / totalValue) * 100 : 0;

  return {
    hasPosition: assetAmount > 0,
    amount: assetAmount,
    value: assetValue,
    allocationPct,
    totalValue,
  };
};

const buildPortfolioSummary = (params: {
  symbol: string;
  insights: PortfolioInsights;
}): { description: string } => {
  if (params.insights.hasPosition) {
    const amountFormatted = params.insights.amount.toLocaleString("fr-FR", {
      maximumFractionDigits: 6,
    });
    const valueFormatted = euroFormatter.format(params.insights.value);
    const allocationFormatted =
      params.insights.allocationPct > 0
        ? `${params.insights.allocationPct.toFixed(1)} %`
        : "moins de 1 %";

    return {
      description: `Analyse portefeuille : vous détenez ${amountFormatted} ${params.symbol} (~${valueFormatted}), soit ${allocationFormatted} de votre allocation totale.`,
    };
  }

  return {
    description: `Analyse portefeuille : vous ne détenez pas encore ${params.symbol}. Surveillez le marché pour décider d'une entrée éventuelle.`,
  };
};

