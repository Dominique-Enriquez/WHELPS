import { db } from '../../server/db'
import { requireUser } from '../../server/auth'
import { method } from '../../server/http'

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'PATCH'])) return
  const user = await requireUser(req, res)
  if (!user) return
  res.setHeader('Cache-Control', 'private, no-store')

  if (req.method === 'GET') {
    const notifications = await db.prepare('SELECT id,application_id applicationId,conversation_id conversationId,type,message,is_read isRead,created_at createdAt FROM notifications WHERE recipient_user_id=? ORDER BY created_at DESC LIMIT 50').all(user.id)
    return res.status(200).json({ notifications })
  }

  const { action, ids } = req.body || {}
  if (!['mark_read', 'delete'].includes(action) || !Array.isArray(ids) || ids.length < 1 || ids.length > 50 || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 200)) {
    return res.status(400).json({ error: 'Choose an action and between 1 and 50 notification IDs.' })
  }
  const uniqueIds = [...new Set(ids)]
  const placeholders = uniqueIds.map(() => '?').join(',')
  // The recipient is taken only from the verified session, including for admins.
  const statement = action === 'delete'
    ? `DELETE FROM notifications WHERE recipient_user_id=? AND id IN (${placeholders})`
    : `UPDATE notifications SET is_read=1 WHERE recipient_user_id=? AND id IN (${placeholders})`
  await db.prepare(statement).run(user.id, ...uniqueIds)
  return res.status(200).json({ ok: true })
}
