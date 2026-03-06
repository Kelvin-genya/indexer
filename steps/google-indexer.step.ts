import { google } from 'googleapis'
import { getNextAvailableKey, incrementUsage } from './config/google-auth-manager'
import type { Handlers, StepConfig } from 'motia'

export const config = {
  name: 'GoogleIndexer',
  description: 'Submits URL to Google Indexing API with key rotation',
  triggers: [
    {
      type: 'queue',
      topic: 'google.index',
    },
  ],
  enqueues: ['submission.retry', 'submission.complete'],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { url, retryCount } = input as { url: string; retryCount?: number }

  const keyResult = await getNextAvailableKey(state)

  if (!keyResult) {
    logger.warn(`All Google API keys exhausted, queuing URL: ${url}`)
    await state.set('pending-queue', url, { url, timestamp: new Date().toISOString() })
    const existing = await state.get<any>('submissions', url)
    await state.set('submissions', url, {
      ...existing,
      url,
      googleStatus: 'queued',
      timestamp: new Date().toISOString(),
    })
    return
  }

  const { auth, keyId } = keyResult

  try {
    const indexing = google.indexing({ version: 'v3', auth })
    await indexing.urlNotifications.publish({
      requestBody: { url, type: 'URL_UPDATED' },
    })

    await incrementUsage(state, keyId)
    const existing = await state.get<any>('submissions', url)
    await state.set('submissions', url, {
      ...existing,
      url,
      googleStatus: 'success',
      keyUsed: keyId,
      timestamp: new Date().toISOString(),
      retryCount: retryCount ?? 0,
    })

    logger.info(`Google indexing success for URL: ${url}, key: ${keyId}`)
    await enqueue({ topic: 'submission.complete', data: { url, service: 'google', keyUsed: keyId } })
  } catch (err: any) {
    const status: number = err?.response?.status ?? err?.code ?? 0

    if (status === 429 || status >= 500) {
      const nextRetryCount = (retryCount ?? 0) + 1
      logger.warn(`Google transient error (${status}) for ${url}, retry #${nextRetryCount}`)
      await enqueue({ topic: 'submission.retry', data: { url, service: 'google', retryCount: nextRetryCount } })
    } else {
      logger.error(`Google permanent error (${status}) for ${url} — ${err?.message}`)
      const existingFail = await state.get<any>('submissions', url)
      await state.set('submissions', url, {
        ...existingFail,
        url,
        googleStatus: 'failed',
        keyUsed: keyId,
        timestamp: new Date().toISOString(),
        retryCount: retryCount ?? 0,
      })
    }
  }
}
