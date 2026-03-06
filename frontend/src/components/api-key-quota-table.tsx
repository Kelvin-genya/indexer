'use client'

import type { ApiKey } from '@/lib/api-client'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface QuotaTableProps {
  keys: ApiKey[]
}

function usageIndicatorClass(pct: number): string {
  if (pct > 95) return '[&>div]:bg-destructive'
  if (pct > 80) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-emerald-500'
}

export default function ApiKeyQuotaTable({ keys }: QuotaTableProps) {
  if (keys.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No API keys configured
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead className="text-right">Used</TableHead>
          <TableHead className="text-right">Limit</TableHead>
          <TableHead className="w-[140px]">Usage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => {
          const pct = key.dailyLimit > 0 ? Math.round((key.dailyUsed / key.dailyLimit) * 100) : 0
          return (
            <TableRow key={key.id}>
              <TableCell className="font-mono text-xs">{key.id}</TableCell>
              <TableCell className="text-right tabular-nums">{key.dailyUsed.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{key.dailyLimit.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className={`h-2 ${usageIndicatorClass(pct)}`} />
                  <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
