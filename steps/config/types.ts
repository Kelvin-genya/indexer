// Shared types for the URL Indexer backend

export interface ApiKeyState {
  id: string
  projectName: string
  credentialsPath: string
  dailyUsed: number
  dailyLimit: number
  lastReset: string
}

export interface SubmissionState {
  url: string
  googleStatus: 'success' | 'failed' | 'pending' | 'queued'
  indexNowStatus: 'success' | 'failed' | 'pending'
  keyUsed: string
  timestamp: string
  retryCount: number
}
