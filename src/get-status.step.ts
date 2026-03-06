import { type StepConfig, type StepHandler } from 'motia'
import { type ApiKeyState } from './config/types'

export const config = {
  name: 'GetStatus',
  triggers: [
    {
      type: 'http',
      method: 'GET',
      path: '/api/status'
    }
  ],
  flows: ['url-indexing']
} as const satisfies StepConfig

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
}

export const handler: StepHandler<typeof config> = async (_input, { state, logger }) => {
  try {
    const keyEntries: Array<{ key: string; value: ApiKeyState }> =
      (await (state as any).getGroup({ group: 'api-keys' })) ?? []
    const pendingQueue: unknown[] = (await (state as any).getGroup({ group: 'pending-queue' })) ?? []

    const pendingQueueSize = pendingQueue.length
    const totalUsed = keyEntries.reduce((sum, e) => sum + (e.value.dailyUsed ?? 0), 0)
    const totalCapacity = keyEntries.reduce((sum, e) => sum + (e.value.dailyLimit ?? 0), 0)

    const keyStats = keyEntries.map((e) => ({
      id: e.value.id,
      projectName: e.value.projectName,
      dailyUsed: e.value.dailyUsed,
      dailyLimit: e.value.dailyLimit,
      lastReset: e.value.lastReset
    }))

    logger.info(`Status fetched: ${keys.length} keys, ${pendingQueueSize} pending`)

    return {
      status: 200,
      headers: CORS_HEADERS,
      body: { keys: keyStats, pendingQueueSize, totalUsed, totalCapacity }
    }
  } catch (err) {
    logger.error('Failed to fetch status', { error: err })
    return {
      status: 500,
      headers: CORS_HEADERS,
      body: { error: 'Failed to fetch status' }
    }
  }
}
