// In-memory PostgREST-shaped fake supabase client for worker tests. It
// implements exactly the query-chain surface the workers use — select /
// insert / update / delete / upsert with eq / is / not / in / or / ilike /
// gt / order / limit and thenable `{ data, error }` resolution — so tests can
// drive whole jobs through `main()`/`initializeRuntime()` with injected
// fakes, the same no-real-environment rule as the rest of workers/*.test.mjs.
//
// Semantics mirror PostgREST closely enough for the workers: filters apply in
// any chain order (filters, then order, then limit), `or(...)` accepts the
// comma-separated `column.op.value` fragments the worker builds (values may
// contain dots, e.g. `domain.ilike.*late.example*`), and `*`/`%` are both
// treated as the ilike wildcard.

function likeToRegExp(pattern) {
  let source = '^'
  for (const ch of String(pattern)) {
    if (ch === '%' || ch === '*') source += '.*'
    else if (ch === '_') source += '.'
    else source += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`${source}$`, 'i')
}

function compare(a, b) {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  return a < b ? -1 : 1
}

function parseOrFragment(fragment) {
  const first = fragment.indexOf('.')
  const second = fragment.indexOf('.', first + 1)
  const column = fragment.slice(0, first)
  const op = fragment.slice(first + 1, second)
  const value = fragment.slice(second + 1)
  return { column, op, value }
}

function rowMatchesFilter(row, filter) {
  const [kind, column, value] = filter
  const cell = row[column]
  switch (kind) {
    case 'eq':
      return cell === value
    case 'is':
      return value === null ? cell === null || cell === undefined : cell === value
    case 'gt':
      return compare(cell, value) > 0
    case 'in':
      return value.includes(cell)
    case 'ilike':
      return likeToRegExp(value).test(String(cell ?? ''))
    case 'or':
      return value.some((fragment) => {
        const parsed = parseOrFragment(fragment)
        const fragmentCell = row[parsed.column]
        if (parsed.op === 'ilike') return likeToRegExp(parsed.value).test(String(fragmentCell ?? ''))
        if (parsed.op === 'eq') return String(fragmentCell ?? '') === parsed.value
        return false
      })
    case 'not': {
      const [op, operand] = value
      return !rowMatchesFilter(row, [op, column, operand])
    }
    default:
      return true
  }
}

export function createFakeSupabase({ tables = {}, rpc = null } = {}) {
  const rows = new Map()
  for (const [key, initial] of Object.entries(tables)) rows.set(key, initial.map((row) => ({ ...row })))
  const calls = []
  const queuedFailures = new Map()

  function createChain(schema, table) {
    const key = `${schema}.${table}`
    const record = {
      schema,
      table,
      op: null,
      columns: null,
      filters: [],
      orders: [],
      limit: Infinity,
      single: false,
      payload: null,
      patch: null,
      options: null,
    }

    function execute() {
      calls.push(record)
      const queued = queuedFailures.get(key)
      if (queued !== undefined && (queued.op === undefined || queued.op === record.op)) {
        queuedFailures.delete(key)
        record.injectedFailure = queued.message
        return { data: null, error: { message: queued.message } }
      }
      // An op-scoped failure stays queued until its operation runs.
      if (!rows.has(key)) rows.set(key, [])
      const tableRows = rows.get(key)
      const matched = tableRows.filter((row) => record.filters.every((filter) => rowMatchesFilter(row, filter)))
      let resultRows
      if (record.op === 'insert') {
        const payload = Array.isArray(record.payload) ? record.payload : [record.payload]
        const inserted = payload.map((entry, index) => ({ id: `${tableRows.length + index + 1}-generated`, ...entry }))
        tableRows.push(...inserted)
        resultRows = inserted
      } else if (record.op === 'update') {
        for (const row of matched) Object.assign(row, record.patch)
        resultRows = matched
      } else if (record.op === 'delete') {
        for (const row of matched) tableRows.splice(tableRows.indexOf(row), 1)
        resultRows = matched
      } else if (record.op === 'upsert') {
        const conflictColumns = String(record.options?.onConflict || '').split(',').filter(Boolean)
        const payload = Array.isArray(record.payload) ? record.payload : [record.payload]
        const upserted = []
        for (const entry of payload) {
          const existing = conflictColumns.length
            ? tableRows.find((row) => conflictColumns.every((column) => row[column] === entry[column]))
            : undefined
          if (existing) {
            // PostgREST resolution=ignore-duplicates returns only the rows it
            // inserted; a conflicting row yields nothing, not the stored row.
            if (!record.options?.ignoreDuplicates) {
              Object.assign(existing, entry)
              upserted.push(existing)
            }
          } else {
            const row = { id: `${tableRows.length + 1}-generated`, ...entry }
            tableRows.push(row)
            upserted.push(row)
          }
        }
        resultRows = upserted
      } else {
        const sorted = [...matched]
        // The workers order by a single column per query; sorting by each
        // recorded order in sequence is sufficient for that.
        for (const [column, ascending] of record.orders) {
          sorted.sort((a, b) => (ascending ? compare(a[column], b[column]) : compare(b[column], a[column])))
        }
        resultRows = record.limit === Infinity ? sorted : sorted.slice(0, record.limit)
      }
      return { data: record.single ? (resultRows[0] ?? null) : resultRows, error: null }
    }

    const chain = {
      select(columns) {
        record.op ||= 'select'
        record.columns = columns
        return chain
      },
      insert(payload) {
        record.op = 'insert'
        record.payload = payload
        return chain
      },
      update(patch) {
        record.op = 'update'
        record.patch = patch
        return chain
      },
      delete() {
        record.op = 'delete'
        return chain
      },
      upsert(payload, options) {
        record.op = 'upsert'
        record.payload = payload
        record.options = options
        return chain
      },
      eq(column, value) {
        record.filters.push(['eq', column, value])
        return chain
      },
      is(column, value) {
        record.filters.push(['is', column, value])
        return chain
      },
      not(column, op, value) {
        record.filters.push(['not', column, [op, op === 'in' ? String(value).replace(/^\(|\)$/g, '').split(',') : value]])
        return chain
      },
      in(column, values) {
        record.filters.push(['in', column, values])
        return chain
      },
      or(clause) {
        record.filters.push(['or', null, String(clause).split(',')])
        return chain
      },
      ilike(column, pattern) {
        record.filters.push(['ilike', column, pattern])
        return chain
      },
      gt(column, value) {
        record.filters.push(['gt', column, value])
        return chain
      },
      order(column, options) {
        record.orders.push([column, options?.ascending !== false])
        return chain
      },
      limit(count) {
        record.limit = count
        return chain
      },
      single() {
        record.single = true
        return chain
      },
      abortSignal() {
        return chain
      },
      then(onFulfilled, onRejected) {
        return Promise.resolve(execute()).then(onFulfilled, onRejected)
      },
    }
    return chain
  }

  return {
    rows,
    calls,
    // Queue an error result for the next query executed against `schema.table`.
    // Pass { op: 'update' } (or 'insert'/'upsert'/'select'/'rpc') to fail only
    // that kind of query.
    failNext(schema, table, message = 'injected failure', { op } = {}) {
      queuedFailures.set(`${schema}.${table}`, op === undefined ? { message } : { message, op })
    },
    schema(name) {
      return {
        from: (table) => createChain(name, table),
        rpc: async (fn, params) => {
          calls.push({ schema: name, table: null, op: 'rpc', fn, params })
          return rpc ? rpc(fn, params) : { data: null, error: null }
        },
      }
    },
  }
}
