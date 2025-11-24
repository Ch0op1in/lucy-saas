import { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificationCenter } from '../hooks/useNotificationCenter'

export const NotificationsCenter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, totalCount, statusLabel, acknowledgeAll } =
    useNotificationCenter({ limit: 25 })

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open) {
      await acknowledgeAll()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/20 bg-background/80 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold">Alertes marché</p>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
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
              unreadCount || totalCount
            )}
          </Badge>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="text-left">
            <DialogTitle>Centre de notifications</DialogTitle>
            <DialogDescription>Les signalements générés par vos règles.</DialogDescription>
          </DialogHeader>

          {notifications === undefined ? (
            <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              Chargement des notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune alerte pour le moment. Créez des règles pour surveiller le marché.
            </div>
          ) : (
            <ScrollArea className="max-h-[360px] pr-4">
              <div className="flex flex-col gap-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="rounded-xl border bg-muted/40 p-3 text-sm shadow-sm transition hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{notification.title}</p>
                      <Badge variant="outline">{notification.assetSymbol ?? 'Global'}</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


