import type { Handlers, StepConfig } from 'motia'

export const config = {
  name: 'RetryHandler',
  description: 'Exponential backoff retry for failed submissions',
  triggers: [
    {
      type: 'queue',
      topic: 'submission.retry',
    },
  ],
  enqueues: ['google.index', 'indexnow.index'],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { url, service, retryCount } = input as {
    url: string
    service: 'google' | 'indexnow'
    retryCount: number
  }

  const statusKey = service === 'google' ? 'googleStatus' : 'indexNowStatus'

  if (retryCount >= 3) {
    logger.warn(`Max retries for ${url} (${service}), marking failed`)
    const existing = await state.get<any>('submissions', url)
    await state.set('submissions', url, { ...existing, [statusKey]: 'failed', retryCount })
    return
  }

  const delay = Math.min(Math.pow(2, retryCount) * 1000 + Math.random() * 1000, 60000)
  await new Promise((resolve) => setTimeout(resolve, delay))

  const topic = service === 'google' ? 'google.index' : 'indexnow.index'
  await enqueue({ topic, data: { url, retryCount } })

  logger.info(`Retrying ${url} for ${service} (attempt ${retryCount})`)
}
