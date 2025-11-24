import type { FC } from 'react'

import { Bolt, PlayCircle, RefreshCw, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const automationStats = [
  { label: 'Scénarios actifs', value: '18', trend: '+3 cette semaine' },
  { label: 'Tâches traitées', value: '42k', trend: '+12 % vs hier' },
  { label: 'Taux de succès', value: '97.5%', trend: 'Stable' },
  { label: 'Temps économisé', value: '128 h', trend: '+18 h ce mois' },
]

const recentRuns = [
  { name: 'Onboarding clients', status: 'Succès', time: '09:24', latency: '1.2 s' },
  { name: 'Sync CRM → HubSpot', status: 'Succès', time: '08:57', latency: '2.4 s' },
  { name: 'Alertes ventes', status: 'Avertissement', time: '08:15', latency: '3.1 s' },
  { name: 'Enrichissement leads', status: 'Succès', time: 'Hier', latency: '1.7 s' },
]

const quickActions = [
  {
    label: 'Nouveau flow',
    description: 'Assembler une automatisation depuis un template',
    icon: Bolt,
  },
  {
    label: 'Exécuter un test',
    description: 'Vérifier un scénario avec des données fictives',
    icon: PlayCircle,
  },
  {
    label: 'Mettre à jour',
    description: 'Relancer les synchronisations à la demande',
    icon: RefreshCw,
  },
]

const Dashboard: FC = () => (
  <div className="space-y-8">
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="size-5 text-primary" />
            Bonjour Hugo 👋
          </CardTitle>
          <CardDescription>
            4 automatisations attendent une revue. Prenez 2 minutes pour valider
            les modifications proposées.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button size="lg">Créer un flow</Button>
          <Button size="lg" variant="outline">
            Voir les derniers runs
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Capacité du cluster</CardTitle>
          <CardDescription>
            L’état des workers reste optimal pour la journée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Utilisation</span>
            <span className="font-medium text-muted-foreground">72 %</span>
          </div>
          <Progress value={72} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>9 workers actifs</span>
            <span>3 en standby</span>
          </div>
        </CardContent>
      </Card>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {automationStats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-3xl">{stat.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Derniers runs</CardTitle>
          <CardDescription>
            Les flux critiques des dernières 24 heures.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Horodatage</TableHead>
                <TableHead>Latence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => (
                <TableRow key={run.name}>
                  <TableCell className="font-medium">{run.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        run.status === 'Succès'
                          ? 'default'
                          : run.status === 'Avertissement'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.time}</TableCell>
                  <TableCell>{run.latency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez aux tâches fréquentes sans quitter le dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickActions.map((action) => (
            <div
              key={action.label}
              className="rounded-lg border bg-card/40 p-4 hover:bg-card transition"
            >
              <div className="flex items-center gap-3">
                <action.icon className="size-4 text-primary" />
                <p className="font-medium">{action.label}</p>
              </div>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          ))}
          <Separator />
          <Button variant="secondary" className="w-full">
            Voir tous les templates
          </Button>
        </CardContent>
      </Card>
    </section>
  </div>
)

export default Dashboard