import type { Handlers, StepConfig } from 'motia'
import { updateSubmission } from './config/submission-helpers'
import { TOPIC_SUBMISSION_RETRY, TOPIC_GOOGLE_INDEX, TOPIC_INDEXNOW_INDEX, MAX_RETRY_COUNT } from './config/constants'

export const config = {
  name: 'RetryHandler',
  description: 'Exponential backoff retry for failed submissions',
  triggers: [{ type: 'queue', topic: TOPIC_SUBMISSION_RETRY }],
  enqueues: [TOPIC_GOOGLE_INDEX, TOPIC_INDEXNOW_INDEX],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { url, service, retryCount } = input as {
    url: string
    service: 'google' | 'indexnow'
    retryCount: number
  }

  const statusKey = service === 'google' ? 'googleStatus' : 'indexNowStatus'

  if (retryCount >= MAX_RETRY_COUNT) {
    logger.warn(`Max retries for ${url} (${service}), marking failed`)
    await updateSubmission(state, url, { [statusKey]: 'failed', retryCount })
    return
  }

  const delay = Math.min(Math.pow(2, retryCount) * 1000 + Math.random() * 1000, 60000)
  await new Promise((resolve) => setTimeout(resolve, delay))

  const topic = service === 'google' ? TOPIC_GOOGLE_INDEX : TOPIC_INDEXNOW_INDEX
  await enqueue({ topic, data: { url, retryCount } })

  logger.info(`Retrying ${url} for ${service} (attempt ${retryCount})`)
}
