import type { Handlers, StepConfig } from 'motia'

export const config = {
  name: 'SubmitUrls',
  triggers: [
    {
      type: 'http',
      method: 'POST',
      path: '/api/submit-urls',
    },
  ],
  enqueues: ['url.submitted'],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (request, { enqueue, logger }) => {
  const { urls } = ((request as any).request?.body ?? (request as any).body ?? {}) as { urls: string[] }

  if (!urls || !Array.isArray(urls)) {
    return {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: 'urls array is required' },
    }
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
    return {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: 'No valid URLs provided' },
    }
  }

  for (const url of validUrls) {
    await enqueue({ topic: 'url.submitted', data: { url } })
  }

  logger.info(`Submitted ${validUrls.length} URLs, rejected ${invalidUrls.length}`)

  return {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: { accepted: validUrls.length, rejected: invalidUrls.length },
  }
}
