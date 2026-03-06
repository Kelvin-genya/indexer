import type { Handlers, StepConfig } from 'motia'
import { TOPIC_URL_SUBMITTED } from './config/constants'
import { getBody, jsonResponse } from './config/http-helpers'

export const config = {
  name: 'SubmitUrls',
  triggers: [{ type: 'http', method: 'POST', path: '/api/submit-urls' }],
  enqueues: [TOPIC_URL_SUBMITTED],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (request, { enqueue, logger }) => {
  const { urls } = getBody<{ urls: string[] }>(request)

  if (!urls || !Array.isArray(urls)) {
    return jsonResponse(400, { error: 'urls array is required' })
  }

  const validUrls: string[] = []
  const invalidUrls: string[] = []

  for (const url of urls) {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      validUrls.push(url)
    } else {
      invalidUrls.push(url)
    }
  }

  if (validUrls.length === 0) {
    return jsonResponse(400, { error: 'No valid URLs provided' })
  }

  await Promise.all(validUrls.map((url) => enqueue({ topic: TOPIC_URL_SUBMITTED, data: { url } })))

  logger.info(`Submitted ${validUrls.length} URLs, rejected ${invalidUrls.length}`)
  return jsonResponse(200, { accepted: validUrls.length, rejected: invalidUrls.length })
}
