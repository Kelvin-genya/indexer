import { type StepConfig, type StepHandler } from 'motia'
import { type SubmissionState } from './config/types'

export const config = {
  name: 'GetHistory',
  triggers: [
    {
      type: 'http',
      method: 'GET',
      path: '/api/history'
    }
  ],
  flows: ['url-indexing']
} as const satisfies StepConfig

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
}

export const handler: StepHandler<typeof config> = async (input, { state, logger }) => {
  try {
    const query = (input as any).query as Record<string, string> | undefined ?? {}
    const limit = Math.min(Math.max(1, parseInt(query['limit'] ?? '50', 10) || 50), 200)
    const offset = Math.max(0, parseInt(query['offset'] ?? '0', 10) || 0)
    const statusFilter = query['status'] ?? null

    const entries: Array<{ key: string; value: SubmissionState }> =
      (await (state as any).getGroup({ group: 'submissions' })) ?? []
    let submissions = entries.map((e) => e.value)

    if (statusFilter) {
      submissions = submissions.filter(
        (s) => s.googleStatus === statusFilter || s.indexNowStatus === statusFilter
      )
    }

    const total = submissions.length
    const paginated = submissions.slice(offset, offset + limit)

    logger.info(`History fetched: ${paginated.length} of ${total} submissions`)

    return {
      status: 200,
      headers: CORS_HEADERS,
      body: { submissions: paginated, total, limit, offset }
    }
  } catch (err) {
    logger.error('Failed to fetch history', { error: err })
    return {
      status: 500,
      headers: CORS_HEADERS,
      body: { error: 'Failed to fetch history' }
    }
  }
}
