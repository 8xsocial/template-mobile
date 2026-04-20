/**
 * RevenueCat webhook — keeps the database subscription state in sync.
 *
 * Setup:
 *   1. Deploy: `supabase functions deploy revenuecat-webhook`
 *   2. In RevenueCat dashboard → Integrations → Webhooks, add:
 *        URL: https://<project>.supabase.co/functions/v1/revenuecat-webhook
 *        Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 *   3. Set the secret in Supabase: supabase secrets set REVENUECAT_WEBHOOK_SECRET=<your-secret>
 *
 * This function listens for subscription lifecycle events and updates
 * the profiles.plan_type column so server-side code always has fresh state.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ACTIVE_EVENTS = new Set([
    'INITIAL_PURCHASE',
    'RENEWAL',
    'PRODUCT_CHANGE',
    'UNCANCELLATION',
])

const INACTIVE_EVENTS = new Set([
    'CANCELLATION',
    'EXPIRATION',
    'BILLING_ISSUE',
    'SUBSCRIBER_ALIAS',
])

Deno.serve(async (req: Request) => {
    // Validate Authorization header
    const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    if (secret) {
        const auth = req.headers.get('Authorization') ?? ''
        if (auth !== `Bearer ${secret}`) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    let body: Record<string, any>
    try {
        body = await req.json()
    } catch {
        return new Response('Bad request', { status: 400 })
    }

    const event = body?.event
    const appUserId: string | undefined = event?.app_user_id

    if (!appUserId || !event?.type) {
        return new Response('OK', { status: 200 })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const isPremium = ACTIVE_EVENTS.has(event.type)
    const isInactive = INACTIVE_EVENTS.has(event.type)

    if (isPremium || isInactive) {
        await supabase
            .from('profiles')
            .update({ plan_type: isPremium ? 'premium' : 'free' })
            .eq('id', appUserId)
    }

    return new Response('OK', { status: 200 })
})
