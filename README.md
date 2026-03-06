# URL Indexer with Motia.dev

Bulk URL submission tool that automatically notifies Google Indexing API and IndexNow services with intelligent key rotation, quota tracking, and real-time dashboard.

## Features

- **Multi-key rotation**: Distributes requests across 10+ GCP service accounts with round-robin
- **Quota tracking**: Real-time monitoring per API key with automatic overflow queuing
- **Google Indexing API**: Submit URLs with automatic retry on transient failures (429, 5xx)
- **IndexNow support**: Bulk POST submission with smart batching
- **Exponential backoff**: Intelligent retry strategy with 3-attempt max
- **Quota reset**: Automatic daily reset at midnight UTC with pending queue drain
- **Next.js dashboard**: Real-time submission tracking and quota visualization
- **Motia event flow**: Type-safe event-driven architecture with persistent state

## Prerequisites

- Node.js 18+
- iii runtime (`curl -fsSL https://install.iii.dev/iii/main/install.sh | sh`)
- motia-cli (`npm install -g motia-cli`)
- 10+ GCP projects with service account JSONs
- IndexNow API key and domain hosting capability

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd indexer
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
GOOGLE_SERVICE_ACCOUNT_PATHS=./credentials/sa-1.json,./credentials/sa-2.json,./credentials/sa-3.json
INDEXNOW_KEY=your-indexnow-key
INDEXNOW_HOST=www.example.com
INDEXNOW_KEY_LOCATION=https://www.example.com/your-key.txt
```

### 3. Add GCP Service Account JSON Files
Place your service account JSONs in `credentials/`:
```bash
mkdir -p credentials
cp ~/Downloads/sa-1.json credentials/
cp ~/Downloads/sa-2.json credentials/
```

## Running

### Backend (Motia)
```bash
iii -c iii-config.yaml
```
Workbench UI available at `http://localhost:3000`

### Frontend (Next.js)
In separate terminal:
```bash
cd frontend
npm run dev
```
Dashboard available at `http://localhost:3001`

## API Endpoints

### Submit URLs
```bash
curl -X POST http://localhost:3000/api/submit-urls \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/page1", "https://example.com/page2"]}'
```
**Response**: `{ "accepted": 2 }`

### Get Status (Quota)
```bash
curl http://localhost:3000/api/status
```
**Response**: Quota per key + pending queue count

### Get History
```bash
curl "http://localhost:3000/api/history?limit=50&offset=0&status=success"
```
**Response**: Paginated submissions with statuses

## Architecture

### Event Flow
```
url.submitted (from API)
  ↓
url-dispatcher (fan-out)
  ↓
┌─────────────────┬──────────────────┐
↓                 ↓
google.index      indexnow.index
↓                 ↓
google-indexer    indexnow-submitter
↓                 ↓
(quota check)     (bulk POST)
↓                 ↓
submission.retry / submission.complete
↓
retry-handler (exponential backoff) → google.index or indexnow.index
↓
quota-reset-cron (daily at midnight)
  ↓
Reset dailyUsed counters
Drain pending-queue
```

### State Management
- **api-keys**: Quota tracking per GCP project
- **submissions**: Full submission history
- **pending-queue**: Overflow URLs when all keys exhausted
- **rotation**: Last key index for round-robin

## Key Rotation Strategy

Each incoming URL is automatically distributed:
1. Check all keys for available quota (< 200 requests/day)
2. Use next available key in round-robin order
3. If all keys exhausted, queue to pending-queue
4. At midnight UTC: reset all counters and drain queue

## Project Structure

```
indexer/
├── src/
│   ├── config/
│   │   ├── types.ts              # Shared interfaces
│   │   └── env.step.ts           # Env loader
│   ├── submit-urls.step.ts        # POST /api/submit-urls
│   ├── get-status.step.ts         # GET /api/status
│   ├── get-history.step.ts        # GET /api/history
│   ├── google-indexer.step.ts     # Google Indexing queue handler
│   ├── google-auth-manager.ts     # Multi-key auth utility
│   ├── indexnow-submitter.step.ts # IndexNow queue handler
│   ├── url-dispatcher.step.ts     # Fan-out distributor
│   ├── retry-handler.step.ts      # Exponential backoff retry
│   └── quota-reset-cron.step.ts   # Daily quota reset
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Submit form
│   │   │   ├── dashboard/         # Quota dashboard
│   │   │   └── history/           # Submission history
│   │   ├── components/            # Reusable UI components
│   │   └── lib/api.ts             # API client
│   └── package.json
├── credentials/                   # GCP service account JSONs (git-ignored)
├── .env                           # Environment variables (git-ignored)
├── .env.example                   # Template
├── iii-config.yaml               # Motia runtime config
└── package.json
```

## Testing Scenarios

### Submit & Track
1. Submit 5 URLs via submit form
2. Watch Workbench for event flow
3. Check dashboard for quota usage
4. View results in history page

### Key Exhaustion
Set `dailyLimit` to 2 per key, submit 10 URLs, watch overflow to pending queue

### Retry Logic
Trigger API errors (429 or invalid auth) and verify exponential backoff

## Security Notes

- Service account JSONs stored in `credentials/` (git-ignored)
- Environment variables required for all API keys
- No sensitive data logged
- Motia state stored in `.motia/` (git-ignored)

## Troubleshooting

**iii won't start**: Verify iii runtime installed and in PATH
**Google API errors**: Check service account JSON paths and GCP project permissions
**IndexNow 422**: Ensure domain is public and key hosted at keyLocation URL
**Large queue**: Cron runs daily at midnight UTC to drain pending-queue

---

Built with Motia.dev | Motia Framework | Google Indexing API | IndexNow
