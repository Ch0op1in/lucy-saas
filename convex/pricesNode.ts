"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { SUPPORTED_ASSETS } from "./prices";

const BINANCE_PRICE_ENDPOINT =
  "https://api.binance.com/api/v3/ticker/price?symbol=";

async function fetchAveragePrice(symbol: string) {
  const response = await fetch(`${BINANCE_PRICE_ENDPOINT}${symbol}`);

  if (!response.ok) {
    throw new Error(`Binance API error ${response.status}`);
  }

  const payload = (await response.json()) as { price: string };
  return Number(payload.price);
}

export const refreshFromBinance = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[cron] refreshFromBinance started");
    const updatedAt = Date.now();

    for (const asset of SUPPORTED_ASSETS) {
      try {
        const numericPrice = await fetchAveragePrice(asset.market);

        if (Number.isNaN(numericPrice)) {
          console.warn(`[cron] Invalid price for ${asset.market}`);
          continue;
        }

        console.log(`[cron] Fetched price for ${asset.symbol}: ${numericPrice}`);

        await ctx.runMutation(internal.prices.upsertPrice, {
          symbol: asset.symbol,
          price: numericPrice,
          updatedAt,
        });
      } catch (error) {
        console.error(
          `[cron] Impossible de récupérer ${asset.market} depuis Binance`,
          error,
        );
      }
    }
    
    console.log("[cron] refreshFromBinance completed");
  },
});


