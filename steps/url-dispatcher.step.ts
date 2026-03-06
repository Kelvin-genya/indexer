import type { Handlers, StepConfig } from 'motia'
import type { SubmissionState } from './config/types'

export const config = {
  name: 'UrlDispatcher',
  description: 'Fan-out from url.submitted to Google + IndexNow queues',
  triggers: [
    {
      type: 'queue',
      topic: 'url.submitted',
    },
  ],
  enqueues: ['google.index', 'indexnow.index'],
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

  await state.set('submissions', url, initialState)
  await enqueue({ topic: 'google.index', data: { url } })
  await enqueue({ topic: 'indexnow.index', data: { url } })

  logger.info(`Dispatched ${url} to Google + IndexNow`)
}
