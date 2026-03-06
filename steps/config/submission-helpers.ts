// Helper for updating submission state with merge semantics

import type { SubmissionState } from './types'
import { STATE_SUBMISSIONS } from './constants'

/** Merge partial updates into an existing submission record */
export async function updateSubmission(
  state: any,
  url: string,
  updates: Partial<SubmissionState>
): Promise<void> {
  const existing = (await state.get(STATE_SUBMISSIONS, url)) as SubmissionState | null
  await state.set(STATE_SUBMISSIONS, url, { ...existing, ...updates })
}
