'use client'

import type { Submission } from '@/lib/api-client'

interface SubmissionHistoryTableProps {
  submissions: Submission[]
  total: number
  limit: number
  offset: number
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onPrev: () => void
  onNext: () => void
}

const STATUS_OPTIONS = ['All', 'success', 'failed', 'pending', 'queued']

function statusBadge(status: string) {
  const normalized = status?.toLowerCase() ?? ''
  const styles: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    queued: 'bg-blue-100 text-blue-800',
  }
  const cls = styles[normalized] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status ?? '—'}
    </span>
  )
}

function formatDate(ts: string): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function SubmissionHistoryTable({
  submissions,
  total,
  limit,
  offset,
  statusFilter,
  onStatusFilterChange,
  onPrev,
  onNext,
}: SubmissionHistoryTableProps) {
  const hasPrev = offset > 0
  const hasNext = offset + limit < total

  return (
    <div className="space-y-4">
      {/* Filter + count row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm text-gray-600 whitespace-nowrap">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s === 'All' ? '' : s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {total === 0 ? 'No results' : `${offset + 1}–${Math.min(offset + limit, total)} of ${total}`}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">URL</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">Google Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">IndexNow Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">Key Used</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No submissions found
                </td>
              </tr>
            )}
            {submissions.map((sub, i) => (
              <tr key={`${sub.url}-${i}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 max-w-xs truncate font-mono text-xs text-gray-700" title={sub.url}>
                  {sub.url}
                </td>
                <td className="px-4 py-3">{statusBadge(sub.googleStatus)}</td>
                <td className="px-4 py-3">{statusBadge(sub.indexNowStatus)}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{sub.keyUsed ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(sub.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
