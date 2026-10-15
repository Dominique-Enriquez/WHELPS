import { db, makeId } from '../../../../server/db'
import { requireUser } from '../../../../server/auth'
import { clean, method } from '../../../../server/http'
import { applicationSelect, EVALUATIONS, ensureConversation, history, notify, userStatus } from '../../../../server/applications'
import { getAdminStatistics } from '../../../../server/adminDashboard'

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'PATCH'])) return
  const admin = await requireUser(req, res, 'ADMIN')
  if (!admin) return
  res.setHeader('Cache-Control', 'private, no-store')
  const app = await db.prepare(applicationSelect('WHERE a.id=?')).get(req.query.id)
  if (!app) return res.status(404).json({ error: 'Application not found.' })
  if (req.method === 'GET') {
    const statusHistory = await db.prepare(`SELECT h.previous_status previousStatus,h.new_status newStatus,h.updated_at updatedAt,h.reason,u.name updatedBy FROM application_status_history h JOIN users u ON u.id=h.updated_by WHERE h.application_id=? ORDER BY h.updated_at DESC`).all(app.id)
    return res.status(200).json({ application: app, history: statusHistory })
  }

  const action = clean(req.body?.action)
  const version = Number(req.body?.version)
  const now = new Date().toISOString()
  if (version !== app.version) return res.status(409).json({ error: 'This application changed. Refresh before continuing.' })
  const evaluations = {
    housing: clean(req.body?.housingEvaluation), financial: clean(req.body?.financialEvaluation),
    experience: clean(req.body?.experienceEvaluation), readiness: clean(req.body?.readinessEvaluation),
    notes: clean(req.body?.internalNotes),
  }
  const saveReview = () => db.prepare(`INSERT INTO administrative_reviews (id,application_id,reviewer_admin_id,housing_evaluation,financial_evaluation,experience_evaluation,readiness_evaluation,internal_notes,reviewed_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(application_id) DO UPDATE SET reviewer_admin_id=excluded.reviewer_admin_id,housing_evaluation=excluded.housing_evaluation,financial_evaluation=excluded.financial_evaluation,experience_evaluation=excluded.experience_evaluation,readiness_evaluation=excluded.readiness_evaluation,internal_notes=excluded.internal_notes,reviewed_at=excluded.reviewed_at`).run(makeId('REV'), app.id, admin.id, evaluations.housing || null, evaluations.financial || null, evaluations.experience || null, evaluations.readiness || null, evaluations.notes || null, now)
  const change = async (status, reason, latest) => {
    const result = await db.prepare('UPDATE adoption_applications SET status=?,updated_at=?,latest_update=?,decision_at=?,version=version+1 WHERE id=? AND version=?').run(status, now, latest, ['Approved — Awaiting Placement', 'Rejected'].includes(status) ? now : null, app.id, version)
    if (!result.changes) throw new Error('CONFLICT')
    await history(app.id, app.status, status, admin.id, reason)
    await notify(app.applicantUserId, app.id, 'APPLICATION_UPDATE', latest, app.conversationId)
  }

  try {
    await db.transaction(async () => {
      if (app.status === 'Cancelled by Applicant' || app.status === 'Adoption Completed') throw new Error('FINALIZED')
      if (app.status === 'Approved — Awaiting Placement' && action !== 'saveReview') throw new Error('MONITORING')
      if (action === 'saveReview') {
        if (![evaluations.housing, evaluations.financial, evaluations.experience, evaluations.readiness].every(x => EVALUATIONS.includes(x))) throw new Error('REVIEW')
        await saveReview()
        const next = app.status === 'Submitted' ? 'Under Review' : app.status
        await change(next, 'Capability assessment review saved.', userStatus(next, app.petName))
      } else if (action === 'requestInfo') {
        const message = clean(req.body?.message)
        if (!message) throw new Error('REASON')
        await saveReview()
        const conversationId = await ensureConversation(app)
        await db.prepare('INSERT INTO messages (id,conversation_id,sender_user_id,content,created_at) VALUES (?,?,?,?,?)').run(makeId('MSG'), conversationId, admin.id, message, now)
        await db.prepare('UPDATE conversations SET last_activity_at=?,closed_at=NULL WHERE id=?').run(now, conversationId)
        await change('Additional Information Required', message, message)
      } else if (action === 'approve') {
        if (![evaluations.housing, evaluations.financial, evaluations.experience, evaluations.readiness].every(x => EVALUATIONS.includes(x) && x)) throw new Error('REVIEW')
        if (app.availability !== 'Available') throw new Error('PET')
        await saveReview()
        const conversationId = await ensureConversation(app)
        await db.prepare(`INSERT INTO adoption_placements (id,application_id,pet_id,adopter_user_id,recorded_by,adopted_at,status) VALUES (?,?,?,?,?,?,?) ON CONFLICT(application_id) DO UPDATE SET status='Monitoring'`).run(makeId('PLC'), app.id, app.petId, app.applicantUserId, admin.id, now, 'Monitoring')
        await db.prepare("UPDATE pets SET availability='On Hold',published=0,updated_at=? WHERE id=?").run(now,app.petId)
        await db.prepare('UPDATE conversations SET closed_at=NULL WHERE id=?').run(conversationId)
        await change('Approved — Awaiting Placement', 'Approved by Whelps administrator.', userStatus('Approved — Awaiting Placement', app.petName))
      } else if (action === 'reject') {
        const reason = clean(req.body?.reason)
        if (!reason) throw new Error('REASON')
        await saveReview()
        await change('Rejected', reason, userStatus('Rejected', app.petName))
        await db.prepare('UPDATE conversations SET closed_at=? WHERE application_id=?').run(now, app.id)
      } else {
        throw new Error('ACTION')
      }
    })()
  } catch (error) {
    const map = {
      FINALIZED: [409, 'Cancelled or completed applications cannot receive review decisions.'],
      MONITORING: [409, 'This application is approved and in monitoring. Review a monitoring update to complete it.'],
      REVIEW: [400, 'Complete all four human-review criteria first.'],
      REASON: [400, 'A reason or message is required.'],
      PET: [409, 'The selected pet is not available.'],
      CONFLICT: [409, 'This application changed. Refresh and try again.'],
      ACTION: [400, 'Unsupported action.'],
    }
    const [code, message] = map[error.message] || [500, 'The application could not be updated.']
    return res.status(code).json({ error: message })
  }
  const [application,statistics]=await Promise.all([db.prepare(applicationSelect('WHERE a.id=?')).get(app.id),getAdminStatistics()])
  res.status(200).json({application,statistics})
}
