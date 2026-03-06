'use client'

import type { ApiKey } from '@/lib/api-client'

interface QuotaTableProps {
  keys: ApiKey[]
  pendingQueueSize: number
  totalUsed: number
  totalCapacity: number
}

function usageColor(pct: number): string {
  if (pct > 95) return 'bg-red-500'
  if (pct > 80) return 'bg-yellow-400'
  return 'bg-green-500'
}

function usageTextColor(pct: number): string {
  if (pct > 95) return 'text-red-700'
  if (pct > 80) return 'text-yellow-700'
  return 'text-green-700'
}

export default function ApiKeyQuotaTable({
  keys,
  pendingQueueSize,
  totalUsed,
  totalCapacity,
}: QuotaTableProps) {
  const totalPct = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Pending queue badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Pending queue:</span>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {pendingQueueSize} URL{pendingQueueSize !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Key ID</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Daily Used</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Daily Limit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Usage %</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[120px]">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No API keys configured
                </td>
              </tr>
            )}
            {keys.map((key) => {
              const pct = key.dailyLimit > 0 ? Math.round((key.dailyUsed / key.dailyLimit) * 100) : 0
              return (
                <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{key.id}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{key.dailyUsed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{key.dailyLimit.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-medium ${usageTextColor(pct)}`}>{pct}%</td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full transition-all ${usageColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* Summary row */}
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700">Total</td>
              <td className="px-4 py-3 text-right font-medium text-gray-700">{totalUsed.toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-700">{totalCapacity.toLocaleString()}</td>
              <td className={`px-4 py-3 text-right font-semibold ${usageTextColor(totalPct)}`}>{totalPct}%</td>
              <td className="px-4 py-3">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all ${usageColor(totalPct)}`}
                    style={{ width: `${Math.min(totalPct, 100)}%` }}
                  />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
