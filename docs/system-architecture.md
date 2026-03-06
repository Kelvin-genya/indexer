# System Architecture

## Overview

URL Indexer is a Motia.dev event-driven system that distributes bulk URL submissions across multiple Google Indexing API keys and IndexNow with intelligent quota management and automatic retry logic.

## Core Components

### API Layer (HTTP Triggers)
- **submit-urls.step.ts**: POST endpoint validates URL array, emits `url.submitted` events
- **get-status.step.ts**: Returns quota usage per key and pending queue depth
- **get-history.step.ts**: Paginated submission history with status filters

### Queue Processors (Event-Driven)
- **url-dispatcher.step.ts**: Fans out each submitted URL to Google + IndexNow topics
- **google-indexer.step.ts**: Handles Google API submissions with multi-key rotation
- **indexnow-submitter.step.ts**: Bulk-posts URLs to IndexNow API
- **retry-handler.step.ts**: Exponential backoff retry for transient failures

### Background Jobs (Cron)
- **quota-reset-cron.step.ts**: Resets daily quotas at midnight UTC and drains pending queue

### Utilities
- **google-auth-manager.ts**: Manages 10+ auth clients for GCP key rotation
- **types.ts**: Shared TypeScript interfaces for type safety

## Event Flow

```
User submits URLs via /api/submit-urls
       ↓
url-dispatcher fans out to two topics:
       ├→ google.index
       │   ├→ google-indexer picks available key (round-robin)
       │   ├→ Success: increment dailyUsed
       │   └→ Failure (429/5xx): emit submission.retry
       │
       └→ indexnow.index
           ├→ indexnow-submitter POST to IndexNow API
           ├→ Success (200/202): mark indexNowStatus complete
           └→ Failure (429): emit submission.retry

Retry loop:
retry-handler checks retryCount:
  ├→ < 3: exponential backoff delay, re-emit to google.index or indexnow.index
  └→ >= 3: mark as permanently failed

Daily at midnight UTC:
quota-reset-cron:
  ├→ Reset dailyUsed = 0 for all keys
  ├→ Drain pending-queue: emit pending URLs to google.index
  └→ Clear pending-queue state
```

## State Management

Motia FileStateAdapter (dev) / Redis (prod) stores:

| Group | Key | Purpose |
|-------|-----|---------|
| api-keys | key-{0..N} | Quota tracking per GCP project |
| submissions | {url} | Full submission record with status |
| pending-queue | {url} | Overflow URLs when all keys exhausted |
| rotation | lastKeyIndex | Round-robin state |

## Key Rotation

1. **Round-robin selection**: Cycles through available keys
2. **Quota awareness**: Skips keys with dailyUsed >= dailyLimit (200)
3. **Pending queue**: Overflow to state when all keys exhausted
4. **Drain on reset**: Cron processes pending queue after midnight reset

## Error Handling

| Error | Handling |
|-------|----------|
| 429 (rate limit) | Emit retry, exponential backoff |
| 5xx (server error) | Emit retry, exponential backoff |
| 401/403 (auth) | Mark permanent failure |
| 400/422 (bad request) | Mark permanent failure |

Max retries: 3 attempts with delay = min(2^attempt * 1000 + jitter, 60000)

## Frontend Dashboard

Next.js app (separate port) with:
- **Submit page**: Bulk URL textarea
- **Quota dashboard**: Per-key usage with progress bars
- **History**: Paginated submissions with status filters

Calls three API endpoints directly (CORS enabled).

## Scalability Notes

- File system state sufficient for personal use
- Redis recommended for production
- Cron runs single-threaded; consider batching for large pending queues
- Google resets quota at Pacific Time; cron runs UTC midnight (safe overlap)
- IndexNow supports 10,000 URLs per request; batching implemented per-event

---

Last updated: 2026-03-07
