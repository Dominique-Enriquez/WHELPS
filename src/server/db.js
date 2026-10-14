import crypto from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Copy the Supabase transaction-pooler connection string into .env.local.')
}

const isLocal = /(?:localhost|127\.0\.0\.1)(?::|\/)/.test(connectionString)
const sql = globalThis.__whelpsPostgres || postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_SIZE || 3),
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  ssl: isLocal ? false : 'require',
})

if (process.env.NODE_ENV !== 'production') globalThis.__whelpsPostgres = sql

const transactionContext = new AsyncLocalStorage()

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
  const connection = transactionContext.getStore() || sql
  const rows = await connection.unsafe(text, parameters)
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
    return (...parameters) => sql.begin(connection => transactionContext.run(connection, () => callback(...parameters)))
  },
  async close() {
    await sql.end()
  },
}

export const makeId = prefix => `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
