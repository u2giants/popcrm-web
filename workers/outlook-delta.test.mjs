import { describe, expect, it, vi } from 'vitest'
import { createGraphCursorStore, resolveOutlookDeltaSettings, runOutlookDeltaSync, validateGraphDeltaLink } from './crm-worker-supabase.mjs'

const graph = (path) => `https://graph.microsoft.com/v1.0/${path}`
const message = (id) => ({ id })

function harness({ cursor = { exists: false, delta_link: null, version: null }, pages, processMessage } = {}) {
  const fetchPage = vi.fn(async (_token, url) => {
    const page = pages[url]
    if (page instanceof Error) throw page
    if (!page) throw new Error(`unexpected page ${url}`)
    return page
  })
  const saveCursor = vi.fn(async ({ deltaLink }) => ({ advanced: true, version: 'next-version', digest: deltaLink.length }))
  const processed = []
  const process = processMessage || vi.fn(async (item) => { processed.push(item.id); return 'created' })
  return { cursor, fetchPage, saveCursor, process, processed }
}

describe('Outlook Microsoft Graph delta synchronization', () => {
  it('handles 125 messages across three pages before saving once', async () => {
    const second = graph('second')
    const final = graph('final')
    const h = harness()
    h.fetchPage
      .mockResolvedValueOnce({ value: Array.from({ length: 50 }, (_, i) => message(String(i))), '@odata.nextLink': second })
      .mockResolvedValueOnce({ value: Array.from({ length: 50 }, (_, i) => message(String(i + 50))), '@odata.nextLink': final })
      .mockResolvedValueOnce({ value: Array.from({ length: 25 }, (_, i) => message(String(i + 100))), '@odata.deltaLink': graph('delta-1') })
    const result = await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor })
    expect(result).toMatchObject({ fetched: 125, created: 125, pages: 3 })
    expect(h.processed).toHaveLength(125)
    expect(h.saveCursor).toHaveBeenCalledOnce()
    expect(h.fetchPage.mock.calls[0][1]).toContain('/mailFolders/inbox/messages/delta?')
    expect(h.saveCursor).toHaveBeenCalledWith({ deltaLink: graph('delta-1'), expectedVersion: null })
  })

  it('does not save when page two fails', async () => {
    const first = graph('crash-1')
    const second = graph('crash-2')
    const h = harness({ cursor: { delta_link: first, version: 'v1' }, pages: {
      [first]: { value: [message('1')], '@odata.nextLink': second },
      [second]: new Error('page failed'),
    } })
    await expect(runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor })).rejects.toThrow('page failed')
    expect(h.saveCursor).not.toHaveBeenCalled()
  })

  it('does not save when any message fails', async () => {
    const first = graph('message-crash')
    const h = harness({ cursor: { delta_link: first, version: 'v1' }, pages: {
      [first]: { value: [message('1'), message('2')], '@odata.deltaLink': graph('never-saved') },
    }, processMessage: vi.fn(async (item) => { if (item.id === '2') throw new Error('insert failed'); return 'created' }) })
    await expect(runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor })).rejects.toThrow('insert failed')
    expect(h.saveCursor).not.toHaveBeenCalled()
  })

  it('counts duplicates, tombstones, and an empty delta without inventing work', async () => {
    const first = graph('mixed')
    const h = harness({ cursor: { delta_link: first, version: 'v1' }, pages: {
      [first]: { value: [message('duplicate'), { id: 'removed', '@removed': { reason: 'deleted' } }], '@odata.nextLink': graph('empty') },
      [graph('empty')]: { value: [], '@odata.deltaLink': graph('delta-mixed') },
    }, processMessage: vi.fn(async (item) => item['@removed'] ? 'tombstone' : 'duplicate') })
    const result = await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor })
    expect(result).toMatchObject({ fetched: 2, duplicate: 1, tombstone: 1, created: 0, pages: 2 })
  })

  it('performs one loud bounded rebuild for an expired token without logging it', async () => {
    const expiredLink = graph('sensitive-expired-token')
    const expired = Object.assign(new Error('HTTP 410'), { expiredDeltaToken: true })
    const fetchPage = vi.fn().mockRejectedValueOnce(expired).mockResolvedValueOnce({ value: [], '@odata.deltaLink': graph('rebuilt') })
    const saveCursor = vi.fn(async () => ({ advanced: true, version: 'v2' }))
    const warn = vi.fn()
    await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: { delta_link: expiredLink, version: 'v1' }, fetchPage, processMessage: vi.fn(), saveCursor, warn, maxExpiredTokenResyncs: 1 })
    expect(warn).toHaveBeenCalledOnce()
    expect(JSON.stringify(warn.mock.calls)).not.toContain(expiredLink)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('resets operator totals when a cursor expires after partial pages', async () => {
    const expired = Object.assign(new Error('HTTP 410'), { expiredDeltaToken: true })
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ value: [message('old-1')], '@odata.nextLink': graph('expires-midwalk') })
      .mockRejectedValueOnce(expired)
      .mockResolvedValueOnce({ value: [message('replayed-1'), message('replayed-2')], '@odata.deltaLink': graph('rebuilt-midwalk') })
    const result = await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: { delta_link: graph('saved-midwalk'), version: 'v1' }, fetchPage, processMessage: vi.fn(async () => 'created'), saveCursor: vi.fn(async () => ({ advanced: true })), warn: vi.fn() })
    expect(result).toMatchObject({ pages: 1, fetched: 2, created: 2 })
  })

  it('fails after the expired-token rebuild cap and never saves', async () => {
    const expired = Object.assign(new Error('HTTP 410'), { expiredDeltaToken: true })
    const h = harness({ cursor: { delta_link: graph('expired'), version: 'v1' }, pages: {} })
    h.fetchPage.mockRejectedValue(expired)
    await expect(runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor, warn: vi.fn(), maxExpiredTokenResyncs: 1 })).rejects.toThrow('HTTP 410')
    expect(h.fetchPage).toHaveBeenCalledTimes(2)
    expect(h.saveCursor).not.toHaveBeenCalled()
  })

  it('rejects malicious continuation and delta links', async () => {
    expect(() => validateGraphDeltaLink('http://graph.microsoft.com/v1.0/x')).toThrow('untrusted')
    expect(() => validateGraphDeltaLink('https://graph.microsoft.com.evil.test/v1.0/x')).toThrow('untrusted')
    expect(() => validateGraphDeltaLink('https://attacker@graph.microsoft.com/v1.0/x')).toThrow('untrusted')
    const first = graph('safe')
    const h = harness({ cursor: { delta_link: first, version: 'v1' }, pages: {
      [first]: { value: [], '@odata.nextLink': 'https://evil.test/steal' },
    } })
    await expect(runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor })).rejects.toThrow('untrusted')
    expect(h.saveCursor).not.toHaveBeenCalled()
  })

  it('rejects a poisoned stored cursor before fetching it', async () => {
    const fetchPage = vi.fn()
    await expect(runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: { delta_link: 'https://evil.test/stored', version: 'v1' }, fetchPage, processMessage: vi.fn(), saveCursor: vi.fn() })).rejects.toThrow('untrusted')
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('resumes from the saved delta link after restart', async () => {
    const saved = graph('saved-resume')
    const h = harness({ cursor: { delta_link: saved, version: 'v9' }, pages: { [saved]: { value: [message('new')], '@odata.deltaLink': graph('next') } } })
    await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor })
    expect(h.fetchPage.mock.calls[0][1]).toBe(saved)
    expect(h.saveCursor).toHaveBeenCalledWith({ deltaLink: graph('next'), expectedVersion: 'v9' })
  })

  it('reloads and replays after a stale compare-and-swap refusal without leaking links', async () => {
    const saved = graph('sensitive-saved')
    const next = graph('sensitive-next')
    const winner = graph('winner-state')
    const h = harness({ cursor: { delta_link: saved, version: 'stale' }, pages: {
      [saved]: { value: [], '@odata.deltaLink': next },
      [winner]: { value: [message('winner-new')], '@odata.deltaLink': graph('winner-next') },
    } })
    h.saveCursor.mockRejectedValueOnce(Object.assign(new Error(`unsafe ${next}`), { code: 'P0001' })).mockResolvedValueOnce({ advanced: true, version: 'v3' })
    const warn = vi.fn()
    const result = await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor, reloadCursor: vi.fn(async () => ({ delta_link: winner, version: 'v2' })), warn })
    expect(result).toMatchObject({ fetched: 1, created: 1 })
    expect(h.saveCursor).toHaveBeenLastCalledWith({ deltaLink: graph('winner-next'), expectedVersion: 'v2' })
    expect(JSON.stringify(warn.mock.calls)).not.toContain(saved)
    expect(JSON.stringify(warn.mock.calls)).not.toContain(next)
  })

  it('bounds stale-writer replays and fails with a generic non-leaking error', async () => {
    const sensitive = graph('sensitive-race-token')
    const h = harness({ cursor: { delta_link: sensitive, version: 'v1' }, pages: { [sensitive]: { value: [], '@odata.deltaLink': graph('race-next') } } })
    h.saveCursor.mockRejectedValue(Object.assign(new Error(`unsafe ${sensitive}`), { code: 'P0001' }))
    const reloadCursor = vi.fn(async () => ({ delta_link: sensitive, version: 'new-version' }))
    await expect(runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor, reloadCursor, warn: vi.fn(), maxConcurrencyRetries: 2 })).rejects.toThrow('concurrency retry limit exhausted')
    expect(h.saveCursor).toHaveBeenCalledTimes(3)
    expect(reloadCursor).toHaveBeenCalledTimes(2)
  })

  it('treats advanced false as a successful save and warns safely', async () => {
    const first = graph('no-progress')
    const warn = vi.fn()
    const h = harness({ cursor: { delta_link: first, version: 'v1' }, pages: { [first]: { value: [], '@odata.deltaLink': first } } })
    h.saveCursor.mockResolvedValue({ advanced: false, version: 'v2' })
    const result = await runOutlookDeltaSync({ accessToken: 'secret', mailbox: 'mail@example.com', cursor: h.cursor, fetchPage: h.fetchPage, processMessage: h.process, saveCursor: h.saveCursor, warn })
    expect(result.cursorAdvanced).toBe(false)
    expect(warn).toHaveBeenCalledWith('outlook-ingest: cursor save succeeded without forward progress')
  })
})

describe('Outlook cursor database wiring', () => {
  it('uses exact CRM RPC names, parameters, and jsonb object returns', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: { exists: false, delta_link: null, version: null, save_count: 0 }, error: null })
      .mockResolvedValueOnce({ data: { cursor_key: 'outlook-ingest:mail@example.com', version: 'v2', save_count: 1, advanced: true }, error: null })
    const schema = vi.fn(() => ({ rpc }))
    const store = createGraphCursorStore({ schema })
    await expect(store.load('outlook-ingest:mail@example.com')).resolves.toEqual({ exists: false, delta_link: null, version: null, save_count: 0 })
    await expect(store.save({ cursorKey: 'outlook-ingest:mail@example.com', mailbox: 'mail@example.com', deltaLink: graph('opaque'), expectedVersion: null })).resolves.toMatchObject({ advanced: true, version: 'v2' })
    expect(schema).toHaveBeenCalledWith('crm')
    expect(rpc).toHaveBeenNthCalledWith(1, 'load_worker_delta_cursor', { p_cursor_key: 'outlook-ingest:mail@example.com' })
    expect(rpc).toHaveBeenNthCalledWith(2, 'save_worker_delta_cursor', { p_cursor_key: 'outlook-ingest:mail@example.com', p_purpose: 'microsoft-graph-mail-delta', p_owner_identity: 'mail@example.com', p_delta_link: graph('opaque'), p_expected_version: null })
  })

  it('preserves only the safe P0001 code and never the database error text', async () => {
    const secret = graph('secret-in-db-error')
    const store = createGraphCursorStore({ schema: () => ({ rpc: vi.fn(async () => ({ data: null, error: { code: 'P0001', message: `stale ${secret}` } })) }) })
    let caught
    try { await store.save({ cursorKey: 'key', mailbox: 'mail', deltaLink: secret, expectedVersion: 'v1' }) } catch (error) { caught = error }
    expect(caught.code).toBe('P0001')
    expect(caught.message).toBe('Outlook cursor save failed')
    expect(caught.message).not.toContain(secret)
  })

  it('validates the expired-token setting before callers make network requests', () => {
    expect(resolveOutlookDeltaSettings({})).toEqual({ maxExpiredTokenResyncs: 1 })
    expect(resolveOutlookDeltaSettings({ OUTLOOK_DELTA_EXPIRED_RESYNC_MAX: '0' })).toEqual({ maxExpiredTokenResyncs: 0 })
    expect(() => resolveOutlookDeltaSettings({ OUTLOOK_DELTA_EXPIRED_RESYNC_MAX: ' 1' })).toThrow('must be an integer')
    expect(() => resolveOutlookDeltaSettings({ OUTLOOK_DELTA_EXPIRED_RESYNC_MAX: '4' })).toThrow('must be an integer')
  })
})
