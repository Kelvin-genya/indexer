import type { Handlers, StepConfig } from 'motia'
import type { SubmissionState } from './config/types'

export const config = {
  name: 'GetHistory',
  triggers: [
    {
      type: 'http',
      method: 'GET',
      path: '/api/history',
    },
  ],
  flows: ['url-indexing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (request, { state, logger }) => {
  try {
    const query = ((request as any).request?.queryParams ?? (request as any).queryParams ?? {}) as Record<string, string>
    const limit = Math.min(Math.max(1, parseInt(query['limit'] ?? '50', 10) || 50), 200)
    const offset = Math.max(0, parseInt(query['offset'] ?? '0', 10) || 0)
    const statusFilter = query['status'] ?? null

    let submissions = await state.list<SubmissionState>('submissions')

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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { submissions: paginated, total, limit, offset },
    }
  } catch (err) {
    logger.error('Failed to fetch history', { error: err })
    return {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: 'Failed to fetch history' },
    }
  }
}
