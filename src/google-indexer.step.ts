import { google } from 'googleapis'
import { getNextAvailableKey, incrementUsage } from './config/google-auth-manager'
import type { QueueStepConfig, QueueStepHandler } from './config/motia-step-types'

export const config: QueueStepConfig = {
  name: 'GoogleIndexer',
  triggers: [{ type: 'queue', subscribes: ['google.index'] }],
  enqueues: ['submission.retry', 'submission.complete'],
  flows: ['url-indexing']
}

export const handler: QueueStepHandler = async (input, { state, enqueue, logger }) => {
  const { url, retryCount } = input.data as { url: string; retryCount?: number }

  const keyResult = await getNextAvailableKey(state)

  if (!keyResult) {
    logger.warn(`All Google API keys exhausted, queuing URL: ${url}`)
    await state.set({
      group: 'pending-queue',
      key: url,
      value: { url, timestamp: new Date().toISOString() }
    })
    await state.set({
      group: 'submissions',
      key: url,
      value: { url, googleStatus: 'queued', timestamp: new Date().toISOString() }
    })
    return
  }

  const { auth, keyId } = keyResult

  try {
    const indexing = google.indexing({ version: 'v3', auth })
    await indexing.urlNotifications.publish({
      requestBody: { url, type: 'URL_UPDATED' }
    })

    await incrementUsage(state, keyId)
    // Merge with existing state to avoid clobbering indexNowStatus
    const existing = await state.get({ group: 'submissions', key: url })
    await state.set({
      group: 'submissions',
      key: url,
      value: {
        ...existing?.value,
        url,
        googleStatus: 'success',
        keyUsed: keyId,
        timestamp: new Date().toISOString(),
        retryCount: retryCount ?? 0
      }
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
      const existingFail = await state.get({ group: 'submissions', key: url })
      await state.set({
        group: 'submissions',
        key: url,
        value: {
          ...existingFail?.value,
          url,
          googleStatus: 'failed',
          keyUsed: keyId,
          timestamp: new Date().toISOString(),
          retryCount: retryCount ?? 0
        }
      })
    }
  }
}
