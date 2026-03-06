import { google } from 'googleapis'
import * as path from 'path'
import type { ApiKeyState } from './types'

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
      dailyLimit: 200,
      lastReset: new Date().toISOString(),
    }
    await state.set('api-keys', `key-${i}`, keyState)
  }
  await state.set('system', 'keysInitialized', true)
}

export async function getNextAvailableKey(
  state: any
): Promise<{ auth: any; keyId: string } | null> {
  const initialized = await state.get('system', 'keysInitialized')
  if (!initialized) {
    await initializeKeys(state)
  }

  const entries: ApiKeyState[] = (await state.list('api-keys')) ?? []
  const available = entries.filter((e) => e.dailyUsed < e.dailyLimit)

  if (available.length === 0) {
    return null
  }

  available.sort((a, b) => a.dailyUsed - b.dailyUsed)
  const entry = available[0]

  const auth = new google.auth.GoogleAuth({
    keyFilename: entry.credentialsPath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })

  return { auth, keyId: entry.id }
}

export async function incrementUsage(state: any, keyId: string): Promise<void> {
  const entry = await state.get<ApiKeyState>('api-keys', keyId)
  if (!entry) return
  await state.set('api-keys', keyId, { ...entry, dailyUsed: entry.dailyUsed + 1 })
}
