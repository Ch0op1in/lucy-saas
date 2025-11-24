import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bell, LayoutDashboard, Loader2, Moon, PlusCircle, Settings, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useTheme } from '@/providers/theme-provider'
import { type FC, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'

type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

const severityTokens: Record<
  NotificationSeverity,
  { label: string; badgeClassName: string }
> = {
  info: {
    label: 'Info',
    badgeClassName: 'bg-slate-100 text-slate-900 dark:bg-slate-900/60 dark:text-slate-100',
  },
  success: {
    label: 'Haussier',
    badgeClassName:
      'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100',
  },
  warning: {
    label: 'Alerte',
    badgeClassName:
      'bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100',
  },
  critical: {
    label: 'Critique',
    badgeClassName:
      'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100',
  },
}

const notificationDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', exact: true },
  { label: 'Paramètres', icon: Settings, href: '/settings' },
]

export const MainLayout: FC = () => {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const notifications = useQuery(api.notifications.list, { limit: 25 })
  const markAllRead = useMutation(api.notifications.markAllRead)

  const notificationCount = notifications?.length ?? 0
  const unreadCount = useMemo(
    () => (notifications ? notifications.filter((notification) => !notification.isRead).length : 0),
    [notifications],
  )
  const notificationsLabel = useMemo(() => {
    if (notifications === undefined) return 'Chargement des alertes...'
    if (notificationCount === 0) return 'Aucune alerte active'
    return `${notificationCount} notification${notificationCount > 1 ? 's' : ''} disponibles`
  }, [notificationCount, notifications])

  const handleNotificationsModal = (open: boolean) => {
    setIsNotificationsOpen(open)

    if (open) {
      markAllRead().catch((error) => {
        console.error('Impossible de marquer les notifications comme lues', error)
      })
    }
  }

  const getSeverityToken = (severity?: NotificationSeverity | null) =>
    severity ? severityTokens[severity] : severityTokens.info

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-muted/20">
        <Sidebar collapsible="icon">
          <SidebarHeader className="px-4 py-6">
            <p className="text-sm font-semibold tracking-tight text-muted-foreground">
              Lucy AI
            </p>
            <h1 className="text-xl font-bold">Votre portefeuille</h1>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.href
                      : location.pathname.startsWith(item.href)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.href} className="flex items-center gap-2">
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 py-6">
            <button
              type="button"
              onClick={() => handleNotificationsModal(true)}
              className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/20 bg-background/80 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">Alertes marché</p>
                <p className="text-xs text-muted-foreground">{notificationsLabel}</p>
              </div>
              <div className="relative inline-flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary transition group-hover:bg-primary/20">
                <Bell className="size-5" />
                <Badge
                  variant="secondary"
                  className="absolute -right-1.5 -top-1.5 border border-background bg-primary px-1.5 py-0 text-[10px] font-bold leading-4 text-white"
                >
                  {notifications === undefined ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    unreadCount || notificationCount
                  )}
                </Badge>
              </div>
            </button>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center gap-2 border-b bg-background px-6 py-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Lucy AI</h2>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sun
                  className={cn(
                    'size-4 transition-colors',
                    theme === 'light' ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <Switch
                  aria-label="Basculer en mode sombre"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Moon
                  className={cn(
                    'size-4 transition-colors',
                    theme === 'dark' ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer bg-green-500 text-white hover:bg-green-600 hover:text-white">
                <PlusCircle className="size-4" />
                Ajouter un actif
              </Button>
            </div>
          </header>
          <div className="flex-1 px-6 py-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>

      <Dialog open={isNotificationsOpen} onOpenChange={handleNotificationsModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="text-left">
            <DialogTitle>Centre de notifications</DialogTitle>
            <DialogDescription>Les signaux générés par vos alertes de marché.</DialogDescription>
          </DialogHeader>

          {notifications === undefined ? (
            <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              Chargement des notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Encore aucune alerte. Ajoutez des actifs ou définissez des seuils pour recevoir des
              signaux.
            </div>
          ) : (
            <ScrollArea className="max-h-[360px] pr-4">
              <div className="flex flex-col gap-3">
                {notifications.map((notification) => {
                  const severityToken = getSeverityToken(
                    (notification.severity as NotificationSeverity | undefined) ?? 'info',
                  )

                  return (
                    <div
                      key={notification._id}
                      className="rounded-xl border bg-muted/40 p-3 text-sm shadow-sm transition hover:border-primary/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{notification.title}</p>
                        <Badge variant="outline" className={severityToken.badgeClassName}>
                          {severityToken.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{notification.message}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">
                          {notification.assetSymbol ?? 'Marché global'}
                          {notification.priceTarget
                            ? ` • Cible ${notification.priceTarget.toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0,
                              })}`
                            : null}
                        </span>
                        <span>{notificationDateFormatter.format(notification.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}