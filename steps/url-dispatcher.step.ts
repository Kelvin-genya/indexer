import type { Handlers, StepConfig } from 'motia'
import type { SubmissionState } from './config/types'
import { TOPIC_URL_SUBMITTED, TOPIC_GOOGLE_INDEX, TOPIC_INDEXNOW_INDEX, STATE_SUBMISSIONS } from './config/constants'

export const config = {
  name: 'UrlDispatcher',
  description: 'Fan-out from url.submitted to Google + IndexNow queues',
  triggers: [{ type: 'queue', topic: TOPIC_URL_SUBMITTED }],
  enqueues: [TOPIC_GOOGLE_INDEX, TOPIC_INDEXNOW_INDEX],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { url } = input as { url: string }

  const initialState: SubmissionState = {
    url,
    googleStatus: 'pending',
    indexNowStatus: 'pending',
    keyUsed: '',
    timestamp: new Date().toISOString(),
    retryCount: 0,
  }

  await state.set(STATE_SUBMISSIONS, url, initialState)
  await Promise.all([
    enqueue({ topic: TOPIC_GOOGLE_INDEX, data: { url } }),
    enqueue({ topic: TOPIC_INDEXNOW_INDEX, data: { url } }),
  ])

  logger.info(`Dispatched ${url} to Google + IndexNow`)
}
