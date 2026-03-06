import type { QueueStepConfig, QueueStepHandler } from './config/motia-step-types'

export const config: QueueStepConfig = {
  name: 'RetryHandler',
  triggers: [{ type: 'queue', subscribes: ['submission.retry'] }],
  enqueues: ['google.index', 'indexnow.index'],
  flows: ['url-indexing']
}

export const handler: QueueStepHandler = async (input, { state, enqueue, logger }) => {
  const { url, service, retryCount } = input.data as {
    url: string
    service: 'google' | 'indexnow'
    retryCount: number
  }

  const existing = await state.get({ group: 'submissions', key: url })
  const statusKey = service === 'google' ? 'googleStatus' : 'indexNowStatus'

  if (retryCount >= 3) {
    logger.warn(`Max retries for ${url} (${service}), marking failed`)
    await state.set({
      group: 'submissions',
      key: url,
      value: { ...existing?.value, [statusKey]: 'failed', retryCount }
    })
    return
  }

  // Exponential backoff with jitter, capped at 60s
  const delay = Math.min(Math.pow(2, retryCount) * 1000 + Math.random() * 1000, 60000)
  await new Promise(resolve => setTimeout(resolve, delay))

  const topic = service === 'google' ? 'google.index' : 'indexnow.index'
  await enqueue({ topic, data: { url, retryCount } })

  logger.info(`Retrying ${url} for ${service} (attempt ${retryCount})`)
}
