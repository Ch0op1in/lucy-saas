import type { Id } from "../../_generated/dataModel"
import type { MutationCtx } from "../../_generated/server"
import { SUPPORTED_ASSETS } from "./constants"

const symbolByCoinId = SUPPORTED_ASSETS.reduce<Record<string, string>>((acc, asset) => {
  acc[asset.coinId] = asset.symbol
  return acc
}, {})

export type PortfolioInsights = {
  hasPosition: boolean
  amount: number
  value: number
  allocationPct: number
  totalValue: number
}

export const buildPortfolioInsights = async (
  ctx: MutationCtx,
  params: { symbol: string; currentPrice: number },
): Promise<PortfolioInsights> => {
  const [portfolioEntries, priceDocs] = await Promise.all([
    ctx.db.query('portfolio').collect(),
    ctx.db.query('tokenPrices').collect(),
  ])

  const priceBySymbol = new Map(priceDocs.map((doc) => [doc.symbol, doc.price]))
  priceBySymbol.set(params.symbol, params.currentPrice)

  const holdings = new Map<
    string,
    {
      amount: number
      ids: Id<'portfolio'>[]
    }
  >()

  for (const entry of portfolioEntries) {
    const symbol = symbolByCoinId[entry.coinId] ?? entry.coinId.toUpperCase()
    const aggregate = holdings.get(symbol) ?? { amount: 0, ids: [] }
    aggregate.amount += entry.amount
    aggregate.ids.push(entry._id)
    holdings.set(symbol, aggregate)
  }

  let totalValue = 0
  for (const [symbol, aggregate] of holdings) {
    const referencePrice =
      symbol === params.symbol ? params.currentPrice : priceBySymbol.get(symbol) ?? 0
    totalValue += aggregate.amount * referencePrice
  }

  const assetHolding = holdings.get(params.symbol)
  const assetAmount = assetHolding?.amount ?? 0
  const assetValue = assetAmount * params.currentPrice
  const allocationPct =
    totalValue > 0 && assetValue > 0 ? (assetValue / totalValue) * 100 : 0

  return {
    hasPosition: assetAmount > 0,
    amount: assetAmount,
    value: assetValue,
    allocationPct,
    totalValue,
  }
}


