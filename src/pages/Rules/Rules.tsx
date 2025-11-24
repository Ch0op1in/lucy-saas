import { type FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { AlertCircle, LineChart } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '../../../convex/_generated/api'

const TOKEN_OPTIONS = [
  { symbol: 'BTC', label: 'Bitcoin (BTC)' },
  { symbol: 'ETH', label: 'Ethereum (ETH)' },
  { symbol: 'SOL', label: 'Solana (SOL)' },
]

type RuleOperator = 'above' | 'below'

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const operatorLabels: Record<
  RuleOperator,
  { symbol: string; description: string }
> = {
  above: { symbol: '>', description: 'supérieur à' },
  below: { symbol: '<', description: 'inférieur à' },
} as const

const normalizeOperator = (value: string | null | undefined): RuleOperator =>
  value === 'below' ? 'below' : 'above'

const Rules = () => {
  const rules = useQuery(api.rules.list)
  const createRule = useMutation(api.rules.create)

  const [selectedToken, setSelectedToken] = useState(TOKEN_OPTIONS[0]?.symbol ?? 'BTC')
  const [operator, setOperator] = useState<RuleOperator>('above')
  const [priceTarget, setPriceTarget] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const isLoading = rules === undefined

  const totalRules = rules?.length ?? 0

  const lastRulesPreview = useMemo(() => {
    if (!rules) return []
    return rules.slice(0, 3)
  }, [rules])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const normalized = Number(priceTarget.replace(',', '.'))
    if (!Number.isFinite(normalized) || normalized <= 0) {
      setFormError('Merci de saisir un montant EUR valide.')
      return
    }

    setIsCreating(true)
    try {
      await createRule({
        assetSymbol: selectedToken,
        operator,
        priceTarget: normalized,
      })
      setPriceTarget('')
      toast.success(
        'Règle bien créée. Vous recevrez des alertes personnalisées en fonction de votre portefeuille.',
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible d'enregistrer la règle."
      setFormError(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <LineChart className="size-4" />
          Automatisation des alertes
        </div>
        <h1 className="text-3xl font-bold">Règles de déclenchement</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Définissez les seuils qui déclenchent automatiquement une notification lorsque le prix
          d&apos;un token passe au-dessus (&gt;) ou en dessous (&lt;) d&apos;un niveau donné. Chaque
          règle créée est immédiatement enregistrée et visible dans le centre de notifications.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Créer une règle</CardTitle>
            <CardDescription>
              Choisissez le token à surveiller, le sens de variation et le seuil en euros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Select value={selectedToken} onValueChange={(value) => setSelectedToken(value)}>
                    <SelectTrigger id="token">
                      <SelectValue placeholder="Sélectionner un token" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKEN_OPTIONS.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operator">Condition</Label>
                  <Select value={operator} onValueChange={(value) => setOperator(value as RuleOperator)}>
                    <SelectTrigger id="operator">
                      <SelectValue placeholder="Choisir une condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Supérieur (&gt;)</SelectItem>
                      <SelectItem value="below">Inférieur (&lt;)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceTarget">Seuil en €</Label>
                <Input
                  id="priceTarget"
                  inputMode="decimal"
                  placeholder="80 000"
                  value={priceTarget}
                  onChange={(event) => setPriceTarget(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Exemple : &ldquo;BTC &gt; 80 000 €&rdquo; vous enverra un signal BUY THE DIP.
                </p>
              </div>

              {formError && (
                <div className="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isCreating}
                className="w-full md:w-auto"
              >
                {isCreating ? 'Enregistrement...' : 'Enregistrer la règle'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Chaque règle enregistrée déclenche automatiquement une notification dans la sidebar.
          </CardFooter>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
            <CardDescription>
              Vue rapide des dernières règles créées et rappel du fonctionnement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-dashed p-4 text-sm">
              <p className="font-semibold">Workflow</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                <li>Sélectionnez un token et un seuil.</li>
                <li>Enregistrez la règle.</li>
                <li>
                  Dès que le prix passe {operatorLabels[operator].description} votre valeur, Lucy
                  pousse une notification.
                </li>
              </ol>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Dernières règles</p>
              {isLoading && (
                <div className="space-y-2">
                  <div className="h-4 rounded bg-muted" />
                  <div className="h-4 rounded bg-muted" />
                  <div className="h-4 rounded bg-muted" />
                </div>
              )}
              {!isLoading && lastRulesPreview.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Créez votre première règle pour surveiller le marché automatiquement.
                </p>
              )}
              {!isLoading &&
                lastRulesPreview.map((rule) => (
                  <div
                    key={rule._id}
                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{rule.assetSymbol}</Badge>
                      <span>
                        {rule.assetSymbol} {operatorLabels[normalizeOperator(rule.operator)].symbol}{' '}
                        {euroFormatter.format(rule.priceTarget)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rule.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
          <CardFooter className="text-sm">
            <div className="flex w-full items-center justify-between">
              <span className="text-muted-foreground">Nombre total de règles</span>
              <span className="text-lg font-semibold">{totalRules}</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Historique des règles</CardTitle>
            <CardDescription>
              Chaque entrée correspond à une règle déclenchant une alerte dès que la condition est
              remplie.
            </CardDescription>
          </div>
          <Badge className="w-fit">Synchronisé avec Convex</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Chargement des règles...</div>
          ) : rules && rules.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Aucune règle enregistrée pour le moment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead className="text-right">Créée le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.map((rule) => (
                  <TableRow key={rule._id}>
                    <TableCell>
                      <div className="font-semibold">{rule.assetSymbol}</div>
                      <p className="text-xs text-muted-foreground">
                        {operatorLabels[normalizeOperator(rule.operator)].description}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono">
                      {rule.assetSymbol} {operatorLabels[normalizeOperator(rule.operator)].symbol}{' '}
                      {euroFormatter.format(rule.priceTarget)}
                    </TableCell>
                    <TableCell>{euroFormatter.format(rule.priceTarget)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(rule.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Rules
