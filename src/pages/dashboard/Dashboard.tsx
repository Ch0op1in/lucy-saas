import { type FC, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Coins, TrendingUp, Wallet } from 'lucide-react'
import { useQuery } from 'convex/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '../../../convex/_generated/api'

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const LoadingChip = () => (
  <span className="inline-block h-6 w-24 animate-pulse rounded bg-muted/50" />
)

const Dashboard: FC = () => {
  const overview = useQuery(api.portfolio.overview)
  const isLoading = overview === undefined

  const summary = overview?.summary ?? {
    totalInvested: 0,
    currentValue: 0,
    gain: 0,
    perfPct: 0,
    distinctAssets: 0,
  }

  const [valueTrend, setValueTrend] = useState<'up' | 'down' | null>(null)
  const previousValueRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoading) return
    const previous = previousValueRef.current
    const next = summary.currentValue

    if (previous !== null && next !== previous) {
      setValueTrend(next > previous ? 'up' : 'down')
      const timeout = setTimeout(() => setValueTrend(null), 500)
      previousValueRef.current = next
      return () => clearTimeout(timeout)
    }

    previousValueRef.current = next
  }, [isLoading, summary.currentValue])

  const lastUpdateLabel = overview?.lastPriceUpdate
    ? new Date(overview.lastPriceUpdate).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : "En attente d'un premier rafraîchissement de prix"

  const formatCurrency = (value: number) => euroFormatter.format(value)
  const formatPercent = (value: number) => {
    const formatted = percentFormatter.format(value)
    return `${value >= 0 ? '+' : ''}${formatted} %`
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total investi</CardDescription>
            <Wallet className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">
              {isLoading ? <LoadingChip /> : formatCurrency(summary.totalInvested)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Valeur actuelle{' '}
              <span
                className={`font-semibold transition-colors duration-1000 ${
                  valueTrend === 'up'
                    ? 'text-emerald-400/80'
                    : valueTrend === 'down'
                      ? 'text-red-400/80'
                      : 'text-foreground'
                }`}
              >
                {isLoading ? '...' : formatCurrency(summary.currentValue)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Cryptos suivies</CardDescription>
            <Coins className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">
              {isLoading ? <LoadingChip /> : summary.distinctAssets}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Total de jetons différents présents dans le portefeuille
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Performance globale</CardDescription>
            <TrendingUp className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl">
                {isLoading ? <LoadingChip /> : formatPercent(summary.perfPct)}
              </CardTitle>
              {!isLoading && (
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    summary.gain >= 0 ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  <ArrowUpRight className="size-4" />
                  {formatCurrency(summary.gain)}
                </span>
              )}
            </div>
            {!overview?.hasManualInvestedValue && (
              <p className="text-xs text-muted-foreground">
                En attente des montants investis pour calculer la perf exacte
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Répartition du portefeuille</CardTitle>
            <CardDescription>
              Conversion en EUR basée sur les derniers prix Binance
            </CardDescription>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Dernière mise à jour
            <br />
            <span className="font-medium">{lastUpdateLabel}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Actif</TableHead>
                <TableHead className="w-[140px] text-right">Quantité</TableHead>
                <TableHead className="w-[140px] text-right">Prix actuel</TableHead>
                <TableHead className="w-[160px] text-right">Valeur</TableHead>
                <TableHead className="w-[200px] text-right">Allocation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex h-24 items-center justify-center text-muted-foreground">
                      Synchronisation du portefeuille...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && overview?.holdings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex h-24 items-center justify-center text-muted-foreground">
                      Ajoutez vos premiers achats pour voir la répartition.
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                overview?.holdings.map((holding) => (
                  <TableRow key={holding.symbol}>
                    <TableCell className="font-semibold">
                      {holding.symbol}
                      <p className="text-xs font-normal text-muted-foreground">
                        {holding.coinId}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {holding.amount.toLocaleString('fr-FR', {
                        maximumFractionDigits: 6,
                      })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(holding.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(holding.currentValue)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <div className="flex flex-col gap-1 text-right">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span>{holding.allocation.toFixed(2)}%</span>
                          <span>{formatCurrency(holding.currentValue)}</span>
                        </div>
                        <Progress value={holding.allocation} className="h-1.5" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard