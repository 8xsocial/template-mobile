import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
        },
    },
})
