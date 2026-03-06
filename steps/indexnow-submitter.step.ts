import type { Handlers, StepConfig } from 'motia'
import { updateSubmission } from './config/submission-helpers'
import { TOPIC_INDEXNOW_INDEX, TOPIC_SUBMISSION_RETRY, TOPIC_SUBMISSION_COMPLETE } from './config/constants'
import { MAX_RETRY_COUNT } from './config/constants'

export const config = {
  name: 'IndexNowSubmitter',
  description: 'Submits URL to IndexNow API (Bing, Yandex, DuckDuckGo)',
  triggers: [{ type: 'queue', topic: TOPIC_INDEXNOW_INDEX }],
  enqueues: [TOPIC_SUBMISSION_RETRY, TOPIC_SUBMISSION_COMPLETE],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { url, retryCount = 0 } = input as { url: string; retryCount?: number }

  const key = process.env.INDEXNOW_KEY
  const host = process.env.INDEXNOW_HOST
  const keyLocation = process.env.INDEXNOW_KEY_LOCATION

  if (!key || !host || !keyLocation) {
    logger.error('Missing IndexNow env vars: INDEXNOW_KEY, INDEXNOW_HOST, INDEXNOW_KEY_LOCATION')
    await updateSubmission(state, url, { indexNowStatus: 'failed' })
    return
  }

  try {
    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList: [url] }),
    })

    if (response.status === 200 || response.status === 202) {
      await updateSubmission(state, url, { indexNowStatus: 'success' })
      await enqueue({ topic: TOPIC_SUBMISSION_COMPLETE, data: { url, service: 'indexnow' } })
      logger.info(`IndexNow success for ${url}`)
    } else if (response.status === 429) {
      logger.warn(`IndexNow rate limited for ${url}, scheduling retry`)
      await enqueue({ topic: TOPIC_SUBMISSION_RETRY, data: { url, service: 'indexnow', retryCount: retryCount + 1 } })
    } else {
      logger.error(`IndexNow error ${response.status} for ${url}`)
      await updateSubmission(state, url, { indexNowStatus: 'failed' })
    }
  } catch (err) {
    logger.error(`IndexNow network error for ${url}: ${String(err)}`)
    // Delegate retry decision to retry-handler instead of duplicating logic here
    await enqueue({ topic: TOPIC_SUBMISSION_RETRY, data: { url, service: 'indexnow', retryCount: retryCount + 1 } })
  }
}
