import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notificationItems, type NotificationItem } from '@/lib/mockData'

function rowToNotification(row: any): NotificationItem {
    return {
        id: row.id,
        title: row.title,
        body: row.body ?? '',
        timeAgo: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '',
        category: row.category,
        read: row.read ?? false,
    }
}

export function useNotifications() {
    return useQuery<NotificationItem[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)
            if (error) throw error
            return (data ?? []).map(rowToNotification)
        },
        placeholderData: notificationItems,
    })
}
