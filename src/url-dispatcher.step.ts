import type { QueueStepConfig, QueueStepHandler } from './config/motia-step-types'
import type { SubmissionState } from './config/types'

export const config: QueueStepConfig = {
  name: 'UrlDispatcher',
  triggers: [{ type: 'queue', subscribes: ['url.submitted'] }],
  enqueues: ['google.index', 'indexnow.index'],
  flows: ['url-indexing']
}

export const handler: QueueStepHandler = async (input, { state, enqueue, logger }) => {
  const { url } = input.data as { url: string }

  const initialState: SubmissionState = {
    url,
    googleStatus: 'pending',
    indexNowStatus: 'pending',
    keyUsed: '',
    timestamp: new Date().toISOString(),
    retryCount: 0
  }

  await state.set({ group: 'submissions', key: url, value: initialState })
  await enqueue({ topic: 'google.index', data: { url } })
  await enqueue({ topic: 'indexnow.index', data: { url } })

  logger.info(`Dispatched ${url} to Google + IndexNow`)
}
