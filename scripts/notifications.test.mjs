import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/pages/api/notifications.route.ts', import.meta.url), 'utf8')
const makeHandler = new Function('db', 'requireUser', 'method', source.replace(/^import .*$/gm, '').replace('export default async function', 'return async function'))
const run = async (body, user = { id: 'owner' }, requestMethod = 'PATCH') => {
  const calls = []
  const db = { prepare: sql => ({ run: async (...params) => calls.push({ sql, params }), all: async (...params) => { calls.push({ sql, params }); return [] } }) }
  const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
  const handler = makeHandler(db, async () => { if (!user) res.status(401).json({ error: 'Authentication required.' }); return user }, (req, res, allowed) => { if (allowed.includes(req.method)) return true; res.status(405).json({}); return false })
  await handler({ method: requestMethod, body }, res)
  return { calls, res }
}

test('read and delete only target the verified recipient, deduplicating IDs', async () => {
  for (const action of ['mark_read', 'delete']) {
    const { calls, res } = await run({ action, ids: ['n1', 'n1', 'n2'], recipient_user_id: 'other' })
    assert.equal(res.code, 200)
    assert.equal(calls.length, 1)
    assert.match(calls[0].sql, /WHERE recipient_user_id=\? AND id IN \(\?,\?\)/)
    assert.match(calls[0].sql, action === 'delete' ? /^DELETE/ : /^UPDATE .* SET is_read=1/)
    assert.deepEqual(calls[0].params, ['owner', 'n1', 'n2'])
  }
})
test('invalid and oversized batches never reach the database', async () => {
  for (const body of [{ action: 'unknown', ids: ['n1'] }, { action: 'delete', ids: [] }, { action: 'delete', ids: [null] }, { action: 'delete', ids: Array(51).fill('n1') }]) {
    const { calls, res } = await run(body)
    assert.equal(res.code, 400)
    assert.equal(calls.length, 0)
  }
})
test('unauthenticated requests never read or change notifications', async () => {
  const { calls, res } = await run({ action: 'delete', ids: ['n1'] }, null)
  assert.equal(res.code, 401)
  assert.equal(calls.length, 0)
})
test('GET preserves the existing recipient-scoped inbox', async () => {
  const { calls, res } = await run(undefined, { id: 'owner' }, 'GET')
  assert.equal(res.code, 200)
  assert.deepEqual(res.body, { notifications: [] })
  assert.deepEqual(calls[0].params, ['owner'])
  assert.match(calls[0].sql, /WHERE recipient_user_id=\? ORDER BY/)
})
