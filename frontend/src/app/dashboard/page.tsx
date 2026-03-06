'use client'

import { useEffect, useState } from 'react'
import ApiKeyQuotaTable from '@/components/api-key-quota-table'
import { getStatus, type StatusResult } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [data, setData] = useState<StatusResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchStatus() {
    try {
      const result = await getStatus()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor API key quotas and pending queue.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchStatus() }}
        >
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Used</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{data.totalUsed.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                of {data.totalCapacity.toLocaleString()} daily capacity
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>API Keys</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{data.keys.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {data.keys.filter((k) => k.dailyUsed < k.dailyLimit).length} with remaining quota
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Queue</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {data.pendingQueueSize}
                {data.pendingQueueSize > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs align-middle">
                    overflow
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">URLs waiting for quota reset</p>
            </CardContent>
          </Card>
        </div>
      )}

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
            <CardTitle className="text-base">Key Usage Breakdown</CardTitle>
            <CardDescription>Per-key quota consumption with visual progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeyQuotaTable keys={data.keys} />
          </CardContent>
        </Card>
      )}

      {data && (
        <p className="text-xs text-muted-foreground text-right">Auto-refreshes every 30s</p>
      )}
    </div>
  )
}
