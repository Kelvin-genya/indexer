// Shared constants for topic names and state groups

// Queue topics
export const TOPIC_URL_SUBMITTED = 'url.submitted' as const
export const TOPIC_GOOGLE_INDEX = 'google.index' as const
export const TOPIC_INDEXNOW_INDEX = 'indexnow.index' as const
export const TOPIC_SUBMISSION_RETRY = 'submission.retry' as const
export const TOPIC_SUBMISSION_COMPLETE = 'submission.complete' as const

// State group names
export const STATE_SUBMISSIONS = 'submissions' as const
export const STATE_API_KEYS = 'api-keys' as const
export const STATE_PENDING_QUEUE = 'pending-queue' as const
export const STATE_SYSTEM = 'system' as const

// Limits
export const MAX_RETRY_COUNT = 3
export const DAILY_LIMIT_PER_KEY = 200
