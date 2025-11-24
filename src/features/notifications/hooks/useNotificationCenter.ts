import { useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../../convex/_generated/api'

type UseNotificationCenterOptions = {
  limit?: number
}

export const useNotificationCenter = (options?: UseNotificationCenterOptions) => {
  const notifications = useQuery(api.notifications.list, { limit: options?.limit ?? 25 })
  const markAllRead = useMutation(api.notifications.markAllRead)

  const counts = useMemo(() => {
    if (!notifications) {
      return { total: 0, unread: 0 }
    }
    const unread = notifications.filter((notification) => !notification.isRead).length
    return { total: notifications.length, unread }
  }, [notifications])

  const statusLabel = useMemo(() => {
    if (notifications === undefined) return 'Chargement des alertes...'
    if (counts.total === 0) return 'Aucune alerte active'
    return `${counts.total} notification${counts.total > 1 ? 's' : ''} disponibles`
  }, [counts.total, notifications])

  const acknowledgeAll = async () => {
    await markAllRead()
  }

  return {
    notifications,
    statusLabel,
    unreadCount: counts.unread,
    totalCount: counts.total,
    acknowledgeAll,
  }
}


