import { query } from "./_generated/server";
import { SUPPORTED_ASSETS } from "./prices";

const symbolByCoinId = SUPPORTED_ASSETS.reduce<Record<string, string>>(
  (acc, asset) => {
    acc[asset.coinId] = asset.symbol;
    return acc;
  },
  {},
);

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const [portfolioEntries, priceDocs] = await Promise.all([
      ctx.db.query("portfolio").collect(),
      ctx.db.query("tokenPrices").collect(),
    ]);

    const priceBySymbol = new Map(
      priceDocs.map((price) => [price.symbol, price.price]),
    );

    const holdings = new Map<
      string,
      {
        coinId: string;
        symbol: string;
        amount: number;
        currentPrice: number;
        currentValue: number;
      }
    >();

    let currentValue = 0;

    for (const entry of portfolioEntries) {
      const symbol =
        symbolByCoinId[entry.coinId] ?? entry.coinId.toUpperCase();
      const livePrice = priceBySymbol.get(symbol) ?? 0;
      const existingHolding = holdings.get(symbol) ?? {
        coinId: entry.coinId,
        symbol,
        amount: 0,
        currentPrice: livePrice,
        currentValue: 0,
      };

      existingHolding.amount += entry.amount;
      existingHolding.currentPrice = livePrice;
      existingHolding.currentValue = existingHolding.amount * livePrice;

      holdings.set(symbol, existingHolding);
      currentValue += entry.amount * livePrice;
    }

    const rawInvestedValue = portfolioEntries.reduce(
      (sum, entry) => sum + (entry.investedEur ?? 0),
      0,
    );
    const investedValue =
      rawInvestedValue > 0 ? rawInvestedValue : currentValue;
    const gain = currentValue - investedValue;
    const perfPct =
      investedValue === 0 ? 0 : (gain / investedValue) * 100;

    const lastPriceUpdate = priceDocs.reduce(
      (latest, doc) => Math.max(latest, doc.updatedAt ?? 0),
      0,
    );

    const holdingsArray = Array.from(holdings.values()).map((holding) => ({
      ...holding,
      allocation:
        currentValue === 0
          ? 0
          : Number(((holding.currentValue / currentValue) * 100).toFixed(2)),
    }));

    return {
      summary: {
        totalInvested: investedValue,
        currentValue,
        gain,
        perfPct,
        distinctAssets: holdings.size,
      },
      holdings: holdingsArray,
      lastPriceUpdate,
      hasManualInvestedValue: rawInvestedValue > 0,
    };
  },
});


