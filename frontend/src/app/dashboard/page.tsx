'use client'

import { useEffect, useState } from 'react'
import ApiKeyQuotaTable from '@/components/api-key-quota-table'
import { getStatus, type StatusResult } from '@/lib/api-client'

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Key Dashboard</h1>
        <button
          onClick={() => { setLoading(true); fetchStatus() }}
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
          <ApiKeyQuotaTable
            keys={data.keys}
            pendingQueueSize={data.pendingQueueSize}
            totalUsed={data.totalUsed}
            totalCapacity={data.totalCapacity}
          />
        </div>
      )}

      {data && (
        <p className="mt-3 text-xs text-gray-400 text-right">Auto-refreshes every 30 seconds</p>
      )}
    </div>
  )
}
