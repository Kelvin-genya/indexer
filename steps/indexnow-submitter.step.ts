import type { Handlers, StepConfig } from 'motia'

export const config = {
  name: 'IndexNowSubmitter',
  description: 'Submits URL to IndexNow API (Bing, Yandex, DuckDuckGo)',
  triggers: [
    {
      type: 'queue',
      topic: 'indexnow.index',
    },
  ],
  enqueues: ['submission.retry', 'submission.complete'],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { url, retryCount } = input as { url: string; retryCount?: number }

  const key = process.env.INDEXNOW_KEY
  const host = process.env.INDEXNOW_HOST
  const keyLocation = process.env.INDEXNOW_KEY_LOCATION

  if (!key || !host || !keyLocation) {
    logger.error('Missing IndexNow env vars: INDEXNOW_KEY, INDEXNOW_HOST, INDEXNOW_KEY_LOCATION')
    const existing = await state.get<any>('submissions', url)
    await state.set('submissions', url, { ...existing, indexNowStatus: 'failed' })
    return
  }

  try {
    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList: [url] }),
    })

    if (response.status === 200 || response.status === 202) {
      const existing = await state.get<any>('submissions', url)
      await state.set('submissions', url, { ...existing, indexNowStatus: 'success' })
      await enqueue({ topic: 'submission.complete', data: { url, service: 'indexnow' } })
      logger.info(`IndexNow success for ${url}`)
    } else if (response.status === 429) {
      logger.warn(`IndexNow rate limited for ${url}, scheduling retry`)
      await enqueue({
        topic: 'submission.retry',
        data: { url, service: 'indexnow', retryCount: (retryCount ?? 0) + 1 },
      })
    } else {
      logger.error(`IndexNow error ${response.status} for ${url}`)
      const existing = await state.get<any>('submissions', url)
      await state.set('submissions', url, { ...existing, indexNowStatus: 'failed' })
    }
  } catch (err) {
    logger.error(`IndexNow network error for ${url}: ${String(err)}`)
    const nextRetry = (retryCount ?? 0) + 1
    if (nextRetry <= 3) {
      await enqueue({
        topic: 'submission.retry',
        data: { url, service: 'indexnow', retryCount: nextRetry },
      })
    } else {
      const existing = await state.get<any>('submissions', url)
      await state.set('submissions', url, { ...existing, indexNowStatus: 'failed' })
    }
  }
}
