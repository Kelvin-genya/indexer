import type { Handlers, StepConfig } from 'motia'
import type { ApiKeyState } from './config/types'
import { TOPIC_GOOGLE_INDEX, STATE_API_KEYS, STATE_PENDING_QUEUE } from './config/constants'

export const config = {
  name: 'QuotaResetCron',
  description: 'Daily midnight UTC quota reset + pending queue drain',
  triggers: [{ type: 'cron', expression: '0 0 0 * * *' }],
  enqueues: [TOPIC_GOOGLE_INDEX],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (_input, { state, enqueue, logger }) => {
  const [keys, pendingUrls] = await Promise.all([
    state.list<ApiKeyState>(STATE_API_KEYS),
    state.list<{ url: string }>(STATE_PENDING_QUEUE),
  ])

  // Reset all key quotas in parallel
  await Promise.all(
    keys.map((key) =>
      state.set(STATE_API_KEYS, key.id, { ...key, dailyUsed: 0, lastReset: new Date().toISOString() })
    )
  )

  // Drain pending queue: re-enqueue and delete in parallel
  await Promise.all(
    pendingUrls.map(async (entry) => {
      await enqueue({ topic: TOPIC_GOOGLE_INDEX, data: { url: entry.url } })
      await state.delete(STATE_PENDING_QUEUE, entry.url)
    })
  )

  logger.info(`Reset ${keys.length} keys, drained ${pendingUrls.length} pending URLs`)
}
