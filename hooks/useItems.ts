import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { itemSummaries, taskItems, type ItemSummary, type TaskItem } from '@/lib/mockData'

function rowToItem(row: any): ItemSummary {
    return {
        id: row.id,
        name: row.name,
        owner: row.owner ?? '',
        status: row.status,
        completion: row.completion ?? 0,
        health: row.health ?? 100,
        activeUsers: row.active_users ?? 0,
        updatedAt: row.updated_at
            ? new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '',
        summary: row.summary ?? '',
    }
}

function rowToTask(row: any): TaskItem {
    return {
        id: row.id,
        itemId: row.item_id,
        title: row.title,
        state: row.state,
        priority: row.priority,
        dueDate: row.due_date ?? '',
    }
}

export function useItems() {
    return useQuery<ItemSummary[]>({
        queryKey: ['items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .is('deleted_at', null)
                .order('updated_at', { ascending: false })
            if (error) throw error
            return (data ?? []).map(rowToItem)
        },
        placeholderData: itemSummaries,
    })
}

export function useItem(id: string) {
    return useQuery<ItemSummary | null>({
        queryKey: ['items', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .maybeSingle()
            if (error) throw error
            return data ? rowToItem(data) : null
        },
        placeholderData: () => itemSummaries.find((i) => i.id === id) ?? null,
    })
}

export function useItemTasks(itemId: string) {
    return useQuery<TaskItem[]>({
        queryKey: ['tasks', itemId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('item_id', itemId)
                .is('deleted_at', null)
                .order('created_at', { ascending: true })
            if (error) throw error
            return (data ?? []).map(rowToTask)
        },
        placeholderData: () => taskItems.filter((t) => t.itemId === itemId),
    })
}
