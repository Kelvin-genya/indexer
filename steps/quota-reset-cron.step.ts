import type { Handlers, StepConfig } from 'motia'
import type { ApiKeyState } from './config/types'

export const config = {
  name: 'QuotaResetCron',
  description: 'Daily midnight UTC quota reset + pending queue drain',
  triggers: [
    {
      type: 'cron',
      expression: '0 0 0 * * *',
    },
  ],
  enqueues: ['google.index'],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (_input, { state, enqueue, logger }) => {
  const keys = await state.list<ApiKeyState & { id: string }>('api-keys')

  for (const key of keys) {
    await state.set('api-keys', key.id, {
      ...key,
      dailyUsed: 0,
      lastReset: new Date().toISOString(),
    })
  }

  const pendingUrls = await state.list<{ url: string }>('pending-queue')

  for (const entry of pendingUrls) {
    await enqueue({ topic: 'google.index', data: { url: entry.url } })
    await state.delete('pending-queue', entry.url)
  }

  logger.info(`Reset ${keys.length} keys, drained ${pendingUrls.length} pending URLs`)
}
