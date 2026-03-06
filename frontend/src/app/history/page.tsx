'use client'

import { useEffect, useState, useCallback } from 'react'
import SubmissionHistoryTable from '@/components/submission-history-table'
import { getHistory, type HistoryResult } from '@/lib/api-client'

const PAGE_LIMIT = 50

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResult | null>(null)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async (currentOffset: number, status: string) => {
    setLoading(true)
    try {
      const result = await getHistory({
        limit: PAGE_LIMIT,
        offset: currentOffset,
        ...(status ? { status } : {}),
      })
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(offset, statusFilter)
  }, [offset, statusFilter, fetchHistory])

  function handleStatusFilterChange(status: string) {
    setStatusFilter(status)
    setOffset(0)
  }

  function handlePrev() {
    setOffset((prev) => Math.max(0, prev - PAGE_LIMIT))
  }

  function handleNext() {
    setOffset((prev) => prev + PAGE_LIMIT)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submission History</h1>
        <button
          onClick={() => fetchHistory(offset, statusFilter)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700
                     hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Loading...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {data && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <SubmissionHistoryTable
            submissions={data.submissions}
            total={data.total}
            limit={data.limit}
            offset={offset}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </div>
      )}
    </div>
  )
}
