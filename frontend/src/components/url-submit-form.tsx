'use client'

import { useState } from 'react'
import { submitUrls } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function UrlSubmitForm() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ accepted: number; rejected: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const urls = input
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    if (urls.length === 0) {
      setError('Please enter at least one URL.')
      return
    }

    setLoading(true)
    try {
      const data = await submitUrls(urls)
      setResult(data)
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const urlCount = input.split('\n').filter((l) => l.trim()).length

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="urls" className="text-sm font-medium">
                URLs (one per line)
              </label>
              {urlCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {urlCount} URL{urlCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Textarea
              id="urls"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="font-mono text-sm resize-none"
              placeholder={'https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3'}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit URLs'}
          </Button>

          {result && (
            <div className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-emerald-400">Submission successful</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Accepted: <span className="text-foreground font-medium">{result.accepted}</span>
                {result.rejected > 0 && (
                  <> &middot; Rejected: <span className="text-destructive font-medium">{result.rejected}</span></>
                )}
              </p>
            </div>
          )}

          {error && (
            <div className="w-full rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="font-medium text-destructive">{error}</span>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </form>
  )
}
