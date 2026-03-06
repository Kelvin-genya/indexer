import type { CronStepConfig, CronStepHandler } from './config/motia-step-types'
import type { ApiKeyState } from './config/types'

export const config: CronStepConfig = {
  name: 'QuotaResetCron',
  triggers: [{ type: 'cron', expression: '0 0 * * *' }],
  enqueues: ['google.index'],
  flows: ['url-indexing']
}

export const handler: CronStepHandler = async (_input, { state, enqueue, logger }) => {
  const keys = await state.getGroup({ group: 'api-keys' }) as Array<{ key: string; value: ApiKeyState }>

  for (const entry of keys) {
    await state.set({
      group: 'api-keys',
      key: entry.key,
      value: { ...entry.value, dailyUsed: 0, lastReset: new Date().toISOString() }
    })
  }

  const pendingUrls = await state.getGroup({ group: 'pending-queue' }) as Array<{ key: string; value: { url: string } }>

  for (const entry of pendingUrls) {
    await enqueue({ topic: 'google.index', data: { url: entry.value.url } })
    await state.delete({ group: 'pending-queue', key: entry.key })
  }

  logger.info(`Reset ${keys.length} keys, drained ${pendingUrls.length} pending URLs`)
}
