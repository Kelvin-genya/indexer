'use client'

import { useEffect, useState, useCallback } from 'react'
import SubmissionHistoryTable from '@/components/submission-history-table'
import { getHistory, type HistoryResult } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">Browse all URL submission records.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchHistory(offset, statusFilter)}>
          Refresh
        </Button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading...</div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissions</CardTitle>
            <CardDescription>{data.total} total record{data.total !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionHistoryTable
              submissions={data.submissions}
              total={data.total}
              limit={data.limit}
              offset={offset}
              statusFilter={statusFilter}
              onStatusFilterChange={(s) => { setStatusFilter(s); setOffset(0) }}
              onPrev={() => setOffset((p) => Math.max(0, p - PAGE_LIMIT))}
              onNext={() => setOffset((p) => p + PAGE_LIMIT)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
