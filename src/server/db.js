import crypto from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Copy the Supabase transaction-pooler connection string into .env.local.')
}

const isLocal = /(?:localhost|127\.0\.0\.1)(?::|\/)/.test(connectionString)
const createClient = () => postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_SIZE || 1),
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  ssl: isLocal ? false : 'require',
})

const getClient = () => {
  if (!globalThis.__whelpsPostgres) globalThis.__whelpsPostgres = createClient()
  return globalThis.__whelpsPostgres
}

const health = globalThis.__whelpsPostgresHealth || { checkedAt: 0, promise: null }
globalThis.__whelpsPostgresHealth = health

const transactionContext = new AsyncLocalStorage()
const HEALTH_TTL_MS = 5000
const HEALTH_TIMEOUT_MS = 1500

function timeoutAfter(milliseconds) {
  let timeout
  const promise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error('DATABASE_HEALTH_TIMEOUT')), milliseconds)
  })
  return { promise, cancel: () => clearTimeout(timeout) }
}

async function replaceClient(staleClient) {
  if (globalThis.__whelpsPostgres === staleClient) globalThis.__whelpsPostgres = createClient()
  try { await staleClient.end({ timeout: 0 }) } catch {}
}

async function ensureHealthy(force = false) {
  if (!force && Date.now() - health.checkedAt < HEALTH_TTL_MS) return
  if (!health.promise) {
    health.promise = (async () => {
      const client = getClient()
      const timer = timeoutAfter(HEALTH_TIMEOUT_MS)
      let healthy = false
      try {
        await Promise.race([client.unsafe('SELECT 1'), timer.promise])
        healthy = true
      } catch {
        await replaceClient(client)
        await getClient().unsafe('SELECT 1')
        healthy = true
      } finally {
        timer.cancel()
        health.checkedAt = healthy ? Date.now() : 0
      }
    })().finally(() => { health.promise = null })
  }
  await health.promise
}

function isConnectionError(error) {
  const message = `${error?.code || ''} ${error?.message || ''}`
  return /CONNECT_TIMEOUT|CONNECTION_(?:ENDED|DESTROYED)|ECONNRESET|ETIMEDOUT|57P0[123]|socket|connection/i.test(message)
}

function compile(source) {
  let parameter = 0
  const text = source.replace(/\?/g, () => `$${++parameter}`)
  const aliases = [...source.matchAll(/\b([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g)].map(match => match[1])
  return { text, aliases }
}

function restoreAliases(rows, aliases) {
  if (!aliases.length) return rows
  return rows.map(row => {
    for (const alias of aliases) {
      const folded = alias.toLowerCase()
      if (folded in row && !(alias in row)) {
        row[alias] = row[folded]
        delete row[folded]
      }
    }
    return row
  })
}

async function execute(source, parameters) {
  const { text, aliases } = compile(source)
  const transaction = transactionContext.getStore()
  if (transaction) return restoreAliases(await transaction.unsafe(text, parameters), aliases)
  await ensureHealthy()
  let connection = getClient()
  let rows
  try {
    rows = await connection.unsafe(text, parameters)
  } catch (error) {
    if (!/^\s*(SELECT|EXPLAIN)\b/i.test(source) || !isConnectionError(error)) throw error
    await replaceClient(connection)
    health.checkedAt = 0
    await ensureHealthy(true)
    connection = getClient()
    rows = await connection.unsafe(text, parameters)
  }
  return restoreAliases(rows, aliases)
}

export const db = {
  prepare(source) {
    return {
      async all(...parameters) {
        return execute(source, parameters)
      },
      async get(...parameters) {
        const rows = await execute(source, parameters)
        return rows[0]
      },
      async run(...parameters) {
        const rows = await execute(source, parameters)
        return { changes: rows.count ?? 0 }
      },
    }
  },
  transaction(callback) {
    return async (...parameters) => {
      await ensureHealthy()
      return getClient().begin(connection => transactionContext.run(connection, () => callback(...parameters)))
    }
  },
  async close() {
    const client = getClient()
    await client.end()
    if (globalThis.__whelpsPostgres === client) delete globalThis.__whelpsPostgres
    health.checkedAt = 0
  },
}

export const makeId = prefix => `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
