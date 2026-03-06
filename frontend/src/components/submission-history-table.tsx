'use client'

import type { Submission } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'queued', label: 'Queued' },
]

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? ''
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    success: 'default',
    failed: 'destructive',
    pending: 'secondary',
    queued: 'outline',
  }
  const variant = variants[s] ?? 'secondary'

  return (
    <Badge variant={variant} className="text-xs capitalize">
      {status ?? '-'}
    </Badge>
  )
}

function formatDate(ts: string): string {
  if (!ts) return '-'
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {/* Filter row */}
      <div className="flex items-center justify-between gap-4">
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => onStatusFilterChange(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums">
          {total === 0 ? 'No results' : `${offset + 1}-${Math.min(offset + limit, total)} of ${total}`}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Google</TableHead>
            <TableHead>IndexNow</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No submissions found
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((sub, i) => (
              <TableRow key={`${sub.url}-${i}`}>
                <TableCell className="max-w-[240px] truncate font-mono text-xs" title={sub.url}>
                  {sub.url}
                </TableCell>
                <TableCell><StatusBadge status={sub.googleStatus} /></TableCell>
                <TableCell><StatusBadge status={sub.indexNowStatus} /></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{sub.keyUsed || '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(sub.timestamp)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
