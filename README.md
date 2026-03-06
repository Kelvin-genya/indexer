# URL Indexer

<p align="center">
  <a href="https://seoengine.ai/?ref=url-indexer">
    <img src="https://img.lightshot.app/vlRu5KRPTXq2f0QPxeXO2A.png" alt="SEO Engine - AI-Powered SEO Platform" width="100%" />
  </a>
</p>

<p align="center">
  <strong>Built by <a href="https://seoengine.ai/?ref=url-indexer">SEO Engine</a></strong> — The AI-powered platform that helps you rank higher, drive more traffic, and convert visitors into customers. <a href="https://seoengine.ai/?ref=url-indexer">Try it free →</a>
</p>

---

> Bulk URL submission tool that automatically notifies **Google Indexing API** and **IndexNow** with intelligent multi-key rotation, quota tracking, retry logic, and a real-time Next.js dashboard.

An event-driven TypeScript framework powered by the iii runtime.

---

## Why This Exists

Getting pages indexed quickly matters for SEO. Google's Indexing API allows direct URL submission but limits each project to **200 requests/day**. This tool solves that by:

- Rotating across **10+ GCP service accounts** automatically (200 x 10 = 2,000+ URLs/day)
- Simultaneously submitting to **IndexNow** (Bing, Yandex, DuckDuckGo)
- **Queuing overflow** URLs when all quotas are spent and draining them at midnight
- Providing a **real-time dashboard** to monitor everything

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Key Rotation** | Distributes requests across 10+ GCP service accounts, picking the least-used key to balance load |
| **Dual Submission** | Every URL goes to both Google Indexing API and IndexNow simultaneously |
| **Quota Tracking** | Real-time per-key usage monitoring with automatic overflow queuing |
| **Smart Retry** | Exponential backoff with jitter (max 3 attempts) for transient failures (429, 5xx) |
| **Daily Reset** | Cron job at midnight UTC resets all quotas and drains the pending queue |
| **Next.js Dashboard** | Submit URLs, view quota usage with visual progress bars, browse submission history |
| **Event-Driven** | Clean step-based architecture using Motia's event flow system |
| **Type-Safe** | Full TypeScript with shared interfaces and strict compilation |

---

## Architecture

```
                          POST /api/submit-urls
                                  │
                                  ▼
                        ┌─────────────────┐
                        │  submit-urls    │  Validate URLs, emit events
                        │  (HTTP Step)    │
                        └────────┬────────┘
                                 │ url.submitted
                                 ▼
                        ┌─────────────────┐
                        │ url-dispatcher  │  Create submission record
                        │ (Queue Step)    │  Fan-out to both services
                        └───┬─────────┬───┘
                            │         │
              google.index  │         │  indexnow.index
                            ▼         ▼
                ┌───────────────┐ ┌──────────────────┐
                │google-indexer │ │indexnow-submitter │
                │               │ │                  │
                │ • Pick key    │ │ • POST to        │
                │   (lowest     │ │   IndexNow API   │
                │    usage)     │ │ • Handle 429     │
                │ • Call API    │ │   throttling     │
                │ • Track quota │ │                  │
                └───┬───────┬───┘ └──┬────────┬──────┘
                    │       │        │        │
                    ▼       ▼        ▼        ▼
             success    failure   success   failure
                    │       │        │        │
                    │       ▼        │        ▼
                    │  submission.   │   submission.
                    │  retry        │   retry
                    │       │        │        │
                    │       ▼        │        ▼
                    │ ┌───────────────────────┐
                    │ │   retry-handler       │
                    │ │                       │
                    │ │ • Exponential backoff  │
                    │ │ • Max 3 attempts      │
                    │ │ • Re-enqueue or fail  │
                    │ └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  quota-reset-cron     │  Daily at midnight UTC
        │                       │
        │  • Reset all dailyUsed│
        │  • Drain pending queue│
        └───────────────────────┘
```

### State Groups

| Group | Purpose | Example Data |
|-------|---------|-------------|
| `api-keys` | Quota tracking per GCP project | `{ id, credentialsPath, dailyUsed, dailyLimit, lastReset }` |
| `submissions` | Full submission history | `{ url, googleStatus, indexNowStatus, keyUsed, timestamp }` |
| `pending-queue` | Overflow URLs when all keys exhausted | `{ url, timestamp }` |
| `system` | System flags | `{ keysInitialized: true }` |

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **iii runtime** — Motia's runtime engine
  ```bash
  curl -fsSL https://install.iii.dev/iii/main/install.sh | sh
  ```
- **GCP Service Accounts** — One or more Google Cloud projects with the [Web Search Indexing API](https://developers.google.com/search/apis/indexing-api/v3/prereqs) enabled
- **IndexNow API Key** — A key hosted at your domain root ([docs](https://www.indexnow.org/documentation))

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/uditgoenka/indexer.git
cd indexer

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Comma-separated paths to GCP service account JSON files
GOOGLE_SERVICE_ACCOUNT_PATHS=./credentials/sa-1.json,./credentials/sa-2.json,./credentials/sa-3.json

# IndexNow configuration
INDEXNOW_KEY=your-indexnow-api-key
INDEXNOW_HOST=www.yourdomain.com
INDEXNOW_KEY_LOCATION=https://www.yourdomain.com/your-indexnow-key.txt
```

### 3. Add GCP Service Account Keys

Place your service account JSON files in `credentials/`:

```bash
cp ~/path/to/sa-project-1.json credentials/sa-1.json
cp ~/path/to/sa-project-2.json credentials/sa-2.json
# ... add as many as you have (each gives 200 requests/day)
```

> **How to create a service account:**
> 1. Go to [Google Cloud Console](https://console.cloud.google.com)
> 2. Create a new project (or use existing)
> 3. Enable the **Web Search Indexing API**
> 4. Go to **IAM & Admin > Service Accounts**
> 5. Create a service account, download the JSON key
> 6. In Google Search Console, add the service account email as a **verified owner**
> 7. Repeat for each project (each project = 200 requests/day)

### 4. Host Your IndexNow Key

Create a text file at your domain root containing your IndexNow key:
```
https://www.yourdomain.com/your-indexnow-key.txt
```
The file content should be just the key string (no newlines, no formatting).

### 5. Run

**Backend** (Motia):
```bash
iii -c iii-config.yaml
```
- API available at `http://localhost:3111`
- Motia Workbench UI at `http://localhost:3111` (visual event flow debugger)

**Frontend** (in a separate terminal):
```bash
cd frontend
npm run dev
```
- Dashboard at `http://localhost:3001`

---

## API Reference

### POST `/api/submit-urls`

Submit an array of URLs for indexing.

**Request:**
```bash
curl -X POST http://localhost:3111/api/submit-urls \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/page-1",
      "https://example.com/page-2",
      "https://example.com/page-3"
    ]
  }'
```

**Response:**
```json
{
  "accepted": 3,
  "rejected": 0
}
```

URLs must start with `http://` or `https://`. Invalid URLs are counted in `rejected`.

---

### GET `/api/status`

Get current quota usage and pending queue depth.

**Request:**
```bash
curl http://localhost:3111/api/status
```

**Response:**
```json
{
  "keys": [
    {
      "id": "key-0",
      "projectName": "project-0",
      "dailyUsed": 42,
      "dailyLimit": 200,
      "lastReset": "2026-03-07T00:00:00.000Z"
    }
  ],
  "pendingQueueSize": 0,
  "totalUsed": 42,
  "totalCapacity": 2000
}
```

---

### GET `/api/history`

Get paginated submission history with optional filtering.

**Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| `limit` | `50` | Results per page (max 200) |
| `offset` | `0` | Skip N results |
| `status` | — | Filter: `success`, `failed`, `pending`, `queued` |

**Request:**
```bash
curl "http://localhost:3111/api/history?limit=10&offset=0&status=success"
```

**Response:**
```json
{
  "submissions": [
    {
      "url": "https://example.com/page-1",
      "googleStatus": "success",
      "indexNowStatus": "success",
      "keyUsed": "key-0",
      "timestamp": "2026-03-07T00:15:30.000Z",
      "retryCount": 0
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## Dashboard

The Next.js frontend provides three pages:

| Page | Route | Description |
|------|-------|-------------|
| **Submit** | `/` | Textarea to paste URLs (one per line), submit button with feedback |
| **Dashboard** | `/dashboard` | Per-key quota table with progress bars, auto-refreshes every 30s |
| **History** | `/history` | Paginated submission table with status filters and color-coded badges |

---

## Key Rotation Strategy

The indexer uses a **lowest-usage-first** strategy to distribute API calls evenly:

1. On each request, all keys are checked for remaining quota (`dailyUsed < dailyLimit`)
2. The key with the **lowest `dailyUsed`** count is selected (race-safe — no shared index counter)
3. If **all keys are exhausted**, the URL is added to the `pending-queue`
4. A cron job runs at **midnight UTC** to:
   - Reset all `dailyUsed` counters to 0
   - Re-enqueue all pending URLs for processing

With 10 GCP projects, you get **2,000 URL submissions per day** to Google's Indexing API.

---

## Project Structure

```
indexer/
├── steps/                            # Motia backend (auto-discovered .step.ts files)
│   ├── config/
│   │   ├── types.ts                  # Shared TypeScript interfaces
│   │   ├── constants.ts              # Shared topic names, state groups, limits
│   │   ├── http-helpers.ts           # CORS, request body/query helpers
│   │   ├── submission-helpers.ts     # State merge helper for submissions
│   │   └── google-auth-manager.ts    # Multi-key auth rotation with caching
│   ├── submit-urls.step.ts           # POST /api/submit-urls
│   ├── get-status.step.ts            # GET /api/status
│   ├── get-history.step.ts           # GET /api/history
│   ├── url-dispatcher.step.ts        # Fan-out to Google + IndexNow queues
│   ├── google-indexer.step.ts        # Google Indexing API consumer
│   ├── indexnow-submitter.step.ts    # IndexNow API consumer
│   ├── retry-handler.step.ts         # Exponential backoff retry logic
│   └── quota-reset-cron.step.ts      # Daily midnight quota reset + queue drain
├── frontend/                         # Next.js dashboard (separate app)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # URL submit form
│   │   │   ├── dashboard/page.tsx    # Quota monitoring dashboard
│   │   │   └── history/page.tsx      # Submission history browser
│   │   ├── components/
│   │   │   ├── url-submit-form.tsx
│   │   │   ├── api-key-quota-table.tsx
│   │   │   └── submission-history-table.tsx
│   │   └── lib/
│   │       └── api-client.ts         # Typed API client
│   └── package.json
├── credentials/                      # GCP service account JSONs (git-ignored)
├── docs/
│   └── system-architecture.md        # Architecture documentation
├── .env.example                      # Environment variable template
├── iii-config.yaml                   # Motia runtime configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json
```

---

## Error Handling

| Error | Behavior |
|-------|----------|
| Google 429 (rate limit) | Retry with exponential backoff (max 3 attempts) |
| Google 5xx (server error) | Retry with exponential backoff (max 3 attempts) |
| Google 4xx (permanent) | Mark as failed, no retry |
| IndexNow 429 (throttle) | Retry with exponential backoff (max 3 attempts) |
| IndexNow 403 (key/domain) | Mark as failed, no retry |
| Network errors | Retry with exponential backoff (max 3 attempts) |
| All keys exhausted | Queue to pending-queue, process after midnight reset |

**Backoff formula:** `min(2^attempt * 1000 + random(0-1000)ms, 60000ms)`

---

## Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_PATHS` | Yes | Comma-separated paths to GCP service account JSON files |
| `INDEXNOW_KEY` | Yes | Your IndexNow API key |
| `INDEXNOW_HOST` | Yes | Your domain (e.g., `www.example.com`) |
| `INDEXNOW_KEY_LOCATION` | Yes | Full URL to your IndexNow key file |

### Frontend Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3111` | Motia backend URL |

---

## Security

- Service account JSON files are stored in `credentials/` (git-ignored)
- All credential paths loaded from environment variables only
- No sensitive data appears in logs
- Motia state files stored in `.motia/` (git-ignored)
- API endpoints are unauthenticated (designed for local/private use)
- CORS headers set to `*` (configure for production)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `iii` command not found | Install: `curl -fsSL https://install.iii.dev/iii/main/install.sh \| sh` |
| Google API 401/403 | Verify service account JSON is valid and email is added as Search Console owner |
| Google API 403 "Indexing API not enabled" | Enable Web Search Indexing API in GCP Console |
| IndexNow 422 | Domain must be publicly accessible; key file must be hosted at `keyLocation` URL |
| Pending queue not draining | Cron runs at midnight UTC; check timezone or trigger manually |
| Frontend can't reach backend | Ensure `NEXT_PUBLIC_API_URL` points to correct Motia backend URL |

---

## Tech Stack

- **[Motia.dev](https://motia.dev)** — Event-driven TypeScript backend framework
- **[iii Runtime](https://install.iii.dev)** — Motia execution engine
- **[Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3)** — Direct URL submission to Google
- **[IndexNow](https://www.indexnow.org)** — Instant indexing for Bing, Yandex, DuckDuckGo
- **[Next.js 15](https://nextjs.org)** — React framework for the dashboard
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first styling

---

## License

MIT

---

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <a href="https://seoengine.ai/?ref=url-indexer">
    <img src="https://img.lightshot.app/vlRu5KRPTXq2f0QPxeXO2A.png" alt="SEO Engine - AI-Powered SEO Platform" width="100%" />
  </a>
</p>

<p align="center">
  <strong>Built by <a href="https://seoengine.ai/?ref=url-indexer">SEO Engine</a></strong> — The AI-powered platform that helps you rank higher, drive more traffic, and convert visitors into customers. <a href="https://seoengine.ai/?ref=url-indexer">Try it free →</a>
</p>
