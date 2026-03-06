import { type StepConfig, type StepHandler } from 'motia'

export const config = {
  name: 'SubmitUrls',
  triggers: [
    {
      type: 'http',
      method: 'POST',
      path: '/api/submit-urls',
      bodySchema: {
        type: 'object',
        properties: {
          urls: { type: 'array', items: { type: 'string' }, minItems: 1 }
        },
        required: ['urls']
      }
    }
  ],
  enqueues: ['url.submitted'] as string[],
  flows: ['url-indexing']
} as const satisfies StepConfig

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
}

export const handler: StepHandler<typeof config> = async (input, { enqueue, logger }) => {
  const { urls } = (input as any).body as { urls: string[] }

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
    logger.warn('No valid URLs provided in submit-urls request')
    return {
      status: 400,
      headers: CORS_HEADERS,
      body: { error: 'No valid URLs provided' }
    }
  }

  for (const url of validUrls) {
    await (enqueue as any)({ topic: 'url.submitted', data: { url } })
  }

  logger.info(`Submitted ${validUrls.length} URLs, rejected ${invalidUrls.length}`)

  return {
    status: 200,
    headers: CORS_HEADERS,
    body: { accepted: validUrls.length, rejected: invalidUrls.length }
  }
}
