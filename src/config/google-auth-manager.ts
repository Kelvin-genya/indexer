import { google } from 'googleapis'
import * as path from 'path'
import { type ApiKeyState } from './types'

// State returns { key, value } entries from getGroup
interface StateEntry { key: string; value: ApiKeyState }

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
      lastReset: new Date().toISOString()
    }
    await state.set({ group: 'api-keys', key: `key-${i}`, value: keyState })
  }
  // Mark keys as initialized so we don't re-seed on empty getGroup
  await state.set({ group: 'system', key: 'keysInitialized', value: true })
}

export async function getNextAvailableKey(
  state: any
): Promise<{ auth: any; keyId: string } | null> {
  // Check if keys need initialization (H2 fix: use flag instead of empty check)
  const initialized = await state.get({ group: 'system', key: 'keysInitialized' })
  if (!initialized?.value) {
    await initializeKeys(state)
  }

  const entries: StateEntry[] = (await state.getGroup({ group: 'api-keys' })) ?? []
  const available = entries.filter((e) => e.value.dailyUsed < e.value.dailyLimit)

  if (available.length === 0) {
    return null
  }

  // H1 fix: pick key with lowest dailyUsed (avoids race condition on lastKeyIndex)
  available.sort((a, b) => a.value.dailyUsed - b.value.dailyUsed)
  const entry = available[0]

  const auth = new google.auth.GoogleAuth({
    keyFilename: entry.value.credentialsPath,
    scopes: ['https://www.googleapis.com/auth/indexing']
  })

  return { auth, keyId: entry.value.id }
}

export async function incrementUsage(state: any, keyId: string): Promise<void> {
  const entry = await state.get({ group: 'api-keys', key: keyId })
  if (!entry?.value) return
  await state.set({
    group: 'api-keys',
    key: keyId,
    value: { ...entry.value, dailyUsed: entry.value.dailyUsed + 1 }
  })
}
