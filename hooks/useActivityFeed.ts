import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { activityItems, type ActivityItem } from '@/lib/mockData'

function rowToActivity(row: any): ActivityItem {
    return {
        id: row.id,
        itemId: row.item_id,
        kind: row.kind,
        title: row.title,
        detail: row.detail ?? '',
        timeAgo: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '',
    }
}

export function useActivityFeed(itemId?: string) {
    return useQuery<ActivityItem[]>({
        queryKey: itemId ? ['activity', itemId] : ['activity'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []

            let query = supabase
                .from('activity_feed')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (itemId) query = query.eq('item_id', itemId)

            const { data, error } = await query
            if (error) throw error
            return (data ?? []).map(rowToActivity)
        },
        placeholderData: activityItems,
    })
}
