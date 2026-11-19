import { describe, expect, it, vi } from 'vitest'
import {
  drainFirefliesRetries,
  handleFirefliesPayload,
  initializeRuntime,
  main,
  processFirefliesWithRetryParking,
} from './crm-worker-supabase.mjs'
import { createFakeSupabase } from './lib/fake-supabase.mjs'

// Issue #68 step 3: one meeting note per Fireflies transcript (upsert on the
// unique index), participant addresses validated with the worker's own parser,
// and failures after the 202 parked in crm.fireflies_retry and drained at the
// start of the next timer run. Everything runs against the injected fake
// client; no real environment is touched.

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
  FIREFLIES_API_KEY: 'test-only-fireflies-key',
}

const MEETING = 'transcript-1'

// V1 payload with the transcript inline, so no upstream Fireflies call happens.
function webhookPayload(meetingId = MEETING, participants = ['Buyer One <buyer@acme.example>']) {
  return {
    meetingId,
    transcript: {
      id: meetingId,
      title: 'Line review',
      date: 1765000000000,
      participants,
      organizer_email: 'organizer@popcre.com',
      summary: { action_items: ['follow up'], overview: 'Quarterly line review.' },
    },
  }
}

function meetingNotes(fake) {
  return fake.rows.get('crm.meeting_note') ?? []
}

function parkedRetries(fake) {
  return fake.rows.get('crm.fireflies_retry') ?? []
}

describe('Fireflies ingest dedupe (#68)', () => {
  it('two deliveries of one transcript processed together produce exactly one note', async () => {
    const fake = createFakeSupabase({})
    initializeRuntime(ENV, { supabaseClient: fake })

    const [first, second] = await Promise.all([
      handleFirefliesPayload(webhookPayload()),
      handleFirefliesPayload(webhookPayload()),
    ])

    const notes = meetingNotes(fake)
    expect(notes).toHaveLength(1)
    expect(notes[0].fireflies_transcript_id).toBe(MEETING)
    // Whichever delivery lost the race reports the honest duplicate outcome.
    expect([first, second].filter((r) => r.skipped === 'duplicate')).toHaveLength(1)
    expect([first, second].every((r) => r.success)).toBe(true)
  })

  it('ignores malformed participant addresses instead of failing the meeting', async () => {
    const fake = createFakeSupabase({})
    initializeRuntime(ENV, { supabaseClient: fake })

    const result = await handleFirefliesPayload(
      webhookPayload(MEETING, [
        'Buyer One <buyer@acme.example>',
        'Broken Token With No Address',
        'truncated@nodot',
        'Weird Two <weird@acme.example trailing junk>',
      ]),
    )

    expect(result.success).toBe(true)
    const notes = meetingNotes(fake)
    expect(notes).toHaveLength(1)
    expect(notes[0].participants).toContain('buyer@acme.example')
    expect(notes[0].participants).not.toContain('truncated@nodot')
    expect(notes[0].participants).not.toContain('weird@acme.example')
  })
})

describe('Fireflies retry parking and drain (#68)', () => {
  it('parks a failed meeting after the 202 and recovers it on the next timer run', async () => {
    const fake = createFakeSupabase({})
    initializeRuntime(ENV, { supabaseClient: fake })

    // The write fails after the webhook was already acknowledged...
    fake.failNext('crm', 'meeting_note', 'meeting_note write failed', { op: 'upsert' })
    await expect(processFirefliesWithRetryParking(webhookPayload())).rejects.toThrow('meeting_note write failed')

    const parked = parkedRetries(fake)
    expect(parked).toHaveLength(1)
    expect(parked[0].meeting_id).toBe(MEETING)
    expect(parked[0].last_error).toBe('meeting_note write failed')
    expect(parked[0].payload.transcript.id).toBe(MEETING)

    // ...and the drain at the start of the next timer run lands the note and
    // removes the parked copy.
    const drain = await drainFirefliesRetries()
    expect(drain).toEqual({ drained: 1, recovered: 1, requeued: 0 })
    expect(meetingNotes(fake)).toHaveLength(1)
    expect(parkedRetries(fake)).toHaveLength(0)
  })

  it('requeues a still-failing meeting with attempts+1 and last_error', async () => {
    const fake = createFakeSupabase({})
    initializeRuntime(ENV, { supabaseClient: fake })

    fake.failNext('crm', 'meeting_note', 'first failure', { op: 'upsert' })
    await expect(processFirefliesWithRetryParking(webhookPayload())).rejects.toThrow('first failure')

    fake.failNext('crm', 'meeting_note', 'still failing', { op: 'upsert' })
    const drain = await drainFirefliesRetries()

    expect(drain).toEqual({ drained: 1, recovered: 0, requeued: 1 })
    const parked = parkedRetries(fake)
    expect(parked).toHaveLength(1)
    expect(parked[0].attempts).toBe(1)
    expect(parked[0].last_error).toBe('still failing')
    expect(meetingNotes(fake)).toHaveLength(0)
  })

  it('drains parked retries at the start of a timer command', async () => {
    const fake = createFakeSupabase({
      tables: {
        'crm.fireflies_retry': [
          { meeting_id: MEETING, payload: webhookPayload(), attempts: 0, last_error: 'earlier failure' },
        ],
      },
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      initializeRuntime(ENV, { supabaseClient: fake })
      // apply-ignore-rules with zero rules exits immediately after its own
      // preamble; the drain must already have run.
      await main(['node', 'crm-worker-supabase.mjs', 'apply-ignore-rules'], ENV, { supabaseClient: fake })

      expect(meetingNotes(fake)).toHaveLength(1)
      expect(parkedRetries(fake)).toHaveLength(0)
    } finally {
      logSpy.mockRestore()
      warnSpy.mockRestore()
    }
  })
})
