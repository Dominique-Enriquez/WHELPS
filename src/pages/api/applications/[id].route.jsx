import { db, makeId } from '../../../server/db'
import { requireUser } from '../../../server/auth'
import { clean, method } from '../../../server/http'
import { ACTIVE, applicationSelect, ensureConversation, history, notify, userStatus } from '../../../server/applications'

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'PATCH'])) return
  const user = await requireUser(req, res)
  if (!user) return
  const app = await db.prepare(applicationSelect('WHERE a.id=?')).get(req.query.id)
  if (!app) return res.status(404).json({ error: 'Application not found.' })
  if (user.role !== 'ADMIN' && app.applicantUserId !== user.id) return res.status(403).json({ error: 'You cannot access this application.' })
  if (req.method === 'GET') {
    const statusHistory = await db.prepare(`SELECT h.previous_status previousStatus,h.new_status newStatus,h.updated_at updatedAt,h.reason,u.name updatedBy FROM application_status_history h JOIN users u ON u.id=h.updated_by WHERE h.application_id=? ORDER BY h.updated_at DESC`).all(app.id)
    return res.status(200).json({ application: app, history: statusHistory })
  }
  if (user.role !== 'USER' || app.applicantUserId !== user.id) return res.status(403).json({ error: 'Only the applicant may perform this action.' })
  const action = clean(req.body?.action)
  const version = Number(req.body?.version)
  if (version !== app.version) return res.status(409).json({ error: 'This application changed. Refresh and try again.' })

  if (action === 'cancel') {
    if (!ACTIVE.includes(app.status)) return res.status(409).json({ error: 'This application can no longer be cancelled.' })
    const now = new Date().toISOString()
    const latest = 'Your adoption request has been successfully cancelled. You may now apply to adopt another available pet.'
    try {
      await db.transaction(async () => {
        const result = await db.prepare("UPDATE adoption_applications SET status='Cancelled by Applicant',cancelled_at=?,updated_at=?,latest_update=?,version=version+1 WHERE id=? AND version=?").run(now, now, latest, app.id, version)
        if (!result.changes) throw new Error('CONFLICT')
        if (app.status === 'Approved — Awaiting Placement') {
          await db.prepare("UPDATE adoption_placements SET status='Cancelled' WHERE application_id=? AND status='Monitoring'").run(app.id)
          await db.prepare("UPDATE pets SET availability='Available',published=CASE WHEN health_verification='Verified' THEN 1 ELSE 0 END,updated_at=? WHERE id=? AND availability='On Hold'").run(now, app.petId)
        }
        await history(app.id, app.status, 'Cancelled by Applicant', user.id, 'Cancelled by applicant.')
        const admins = await db.prepare("SELECT id FROM users WHERE role='ADMIN'").all()
        await Promise.all(admins.map(admin => notify(admin.id, app.id, 'APPLICATION_CANCELLED', `${app.fullName} cancelled the adoption request for ${app.petName}.`)))
        await db.prepare('UPDATE conversations SET closed_at=? WHERE application_id=?').run(now, app.id)
      })()
    } catch (error) {
      if (error.message === 'CONFLICT') return res.status(409).json({ error: 'This application changed. Refresh and try again.' })
      throw error
    }
    return res.status(200).json({ application: await db.prepare(applicationSelect('WHERE a.id=?')).get(app.id), message: latest })
  }

  if (action === 'clarification') {
    if (app.status !== 'Additional Information Required') return res.status(409).json({ error: 'This application is not awaiting clarification.' })
    const content = clean(req.body?.message)
    if (!content) return res.status(400).json({ error: 'Enter the requested information.' })
    const now = new Date().toISOString()
    await db.transaction(async () => {
      const conversationId = await ensureConversation(app)
      await db.prepare('INSERT INTO messages (id,conversation_id,sender_user_id,content,created_at) VALUES (?,?,?,?,?)').run(makeId('MSG'), conversationId, user.id, content, now)
      const result = await db.prepare("UPDATE adoption_applications SET status='Under Review',updated_at=?,latest_update=?,version=version+1 WHERE id=? AND version=?").run(now, userStatus('Under Review', app.petName), app.id, version)
      if (!result.changes) throw new Error('CONFLICT')
      await db.prepare('UPDATE conversations SET last_activity_at=? WHERE id=?').run(now, conversationId)
      await history(app.id, app.status, 'Under Review', user.id, 'Applicant supplied requested information.')
      const admins = await db.prepare("SELECT id FROM users WHERE role='ADMIN'").all()
      await Promise.all(admins.map(admin => notify(admin.id, app.id, 'CLARIFICATION_RECEIVED', `${app.fullName} supplied additional information.`, conversationId)))
    })()
    return res.status(200).json({ application: await db.prepare(applicationSelect('WHERE a.id=?')).get(app.id) })
  }
  res.status(400).json({ error: 'Unsupported action.' })
}
