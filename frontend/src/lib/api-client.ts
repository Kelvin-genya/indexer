const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface SubmitUrlsResult {
  accepted: number
  rejected: number
}

export interface ApiKey {
  id: string
  dailyUsed: number
  dailyLimit: number
}

export interface StatusResult {
  keys: ApiKey[]
  pendingQueueSize: number
  totalUsed: number
  totalCapacity: number
}

export interface Submission {
  url: string
  googleStatus: string
  indexNowStatus: string
  keyUsed?: string
  timestamp: string
}

export interface HistoryResult {
  submissions: Submission[]
  total: number
  limit: number
  offset: number
}

export async function submitUrls(urls: string[]): Promise<SubmitUrlsResult> {
  const res = await fetch(`${API_BASE}/api/submit-urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  })
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`)
  return res.json()
}

export async function getStatus(): Promise<StatusResult> {
  const res = await fetch(`${API_BASE}/api/status`)
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`)
  return res.json()
}

export interface HistoryParams {
  limit?: number
  offset?: number
  status?: string
}

export async function getHistory(params?: HistoryParams): Promise<HistoryResult> {
  const qs = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : ''
  const res = await fetch(`${API_BASE}/api/history${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`)
  return res.json()
}
