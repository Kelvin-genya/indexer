import { google } from 'googleapis'
import type { GoogleAuth } from 'googleapis-common'
import * as path from 'path'
import type { ApiKeyState } from './types'
import { STATE_API_KEYS, STATE_SYSTEM, DAILY_LIMIT_PER_KEY } from './constants'

// Cached auth clients keyed by keyId — avoids re-parsing JSON files per request
const authCache = new Map<string, GoogleAuth>()

let keysInitialized = false

export function loadServiceAccountPaths(): string[] {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PATHS
  if (!raw || !raw.trim()) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_PATHS env var is missing or empty')
  }
  return raw.split(',').map((p) => path.resolve(p.trim()))
}

export async function initializeKeys(state: any): Promise<void> {
  const paths = loadServiceAccountPaths()
  for (let i = 0; i < paths.length; i++) {
    const keyState: ApiKeyState = {
      id: `key-${i}`,
      projectName: `project-${i}`,
      credentialsPath: paths[i],
      dailyUsed: 0,
      dailyLimit: DAILY_LIMIT_PER_KEY,
      lastReset: new Date().toISOString(),
    }
    await state.set(STATE_API_KEYS, `key-${i}`, keyState)
  }
  await state.set(STATE_SYSTEM, 'keysInitialized', true)
  keysInitialized = true
}

export async function getNextAvailableKey(
  state: any
): Promise<{ auth: GoogleAuth; keyId: string } | null> {
  if (!keysInitialized) {
    const initialized = await state.get(STATE_SYSTEM, 'keysInitialized')
    if (!initialized) {
      await initializeKeys(state)
    }
    keysInitialized = true
  }

  const entries: ApiKeyState[] = (await state.list(STATE_API_KEYS)) ?? []
  const available = entries.filter((e) => e.dailyUsed < e.dailyLimit)

  if (available.length === 0) return null

  available.sort((a, b) => a.dailyUsed - b.dailyUsed)
  const entry = available[0]

  // Return cached auth client or create and cache a new one
  let auth = authCache.get(entry.id)
  if (!auth) {
    auth = new google.auth.GoogleAuth({
      keyFilename: entry.credentialsPath,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    authCache.set(entry.id, auth)
  }

  return { auth, keyId: entry.id }
}

export async function incrementUsage(state: any, keyId: string): Promise<void> {
  const entry = (await state.get(STATE_API_KEYS, keyId)) as ApiKeyState | null
  if (!entry) return
  await state.set(STATE_API_KEYS, keyId, { ...entry, dailyUsed: entry.dailyUsed + 1 })
}
