'use client'

import { useState } from 'react'
import { submitUrls } from '@/lib/api-client'

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-1">
          URLs (one per line)
        </label>
        <textarea
          id="urls"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-400"
          placeholder="https://example.com/page-1&#10;https://example.com/page-2"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        {loading ? 'Submitting...' : 'Submit URLs'}
      </button>

      {result && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <p className="font-medium">Submission successful</p>
          <p>Accepted: {result.accepted} &nbsp;|&nbsp; Rejected: {result.rejected}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
    </form>
  )
}
