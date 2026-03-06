import type { Handlers, StepConfig } from 'motia'
import type { ApiKeyState } from './config/types'

export const config = {
  name: 'GetStatus',
  triggers: [
    {
      type: 'http',
      method: 'GET',
      path: '/api/status',
    },
  ],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (_request, { state, logger }) => {
  try {
    const keys = await state.list<ApiKeyState>('api-keys')
    const pendingQueue = await state.list<{ url: string; timestamp: string }>('pending-queue')

    const pendingQueueSize = pendingQueue.length
    const totalUsed = keys.reduce((sum, k) => sum + (k.dailyUsed ?? 0), 0)
    const totalCapacity = keys.reduce((sum, k) => sum + (k.dailyLimit ?? 0), 0)

    const keyStats = keys.map((k) => ({
      id: k.id,
      projectName: k.projectName,
      dailyUsed: k.dailyUsed,
      dailyLimit: k.dailyLimit,
      lastReset: k.lastReset,
    }))

    logger.info(`Status fetched: ${keys.length} keys, ${pendingQueueSize} pending`)

    return {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { keys: keyStats, pendingQueueSize, totalUsed, totalCapacity },
    }
  } catch (err) {
    logger.error('Failed to fetch status', { error: err })
    return {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: 'Failed to fetch status' },
    }
  }
}
