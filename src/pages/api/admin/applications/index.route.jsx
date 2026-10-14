import { db } from '../../../../server/db'
import { requireUser } from '../../../../server/auth'
import { clean, method } from '../../../../server/http'
import { applicationSelect } from '../../../../server/applications'

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return
  if (!await requireUser(req, res, 'ADMIN')) return

  const status = clean(req.query.status)
  const search = clean(req.query.search).toLowerCase()
  const sort = req.query.sort === 'oldest' ? 'a.submitted_at ASC' : 'a.submitted_at DESC'
  const clauses = []
  const params = []
  if (status && status !== 'All Applications') {
    clauses.push('a.status=?')
    params.push(status)
  }
  if (search) {
    clauses.push('(lower(a.full_name) LIKE ? OR lower(a.id) LIKE ? OR lower(p.name) LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const [applications, countRows, users, availablePets, adoptedPets, total, healthPending, unreadMessages, pendingMonitoring] = await Promise.all([
    db.prepare(applicationSelect(where, sort)).all(...params),
    db.prepare('SELECT status,COUNT(*) count FROM adoption_applications GROUP BY status').all(),
    db.prepare("SELECT COUNT(*) count FROM users WHERE role='USER'").get(),
    db.prepare("SELECT COUNT(*) count FROM pets WHERE availability='Available' AND published=1").get(),
    db.prepare("SELECT COUNT(*) count FROM pets WHERE availability='Adopted'").get(),
    db.prepare('SELECT COUNT(*) count FROM adoption_applications').get(),
    db.prepare("SELECT COUNT(*) count FROM pets WHERE health_verification<>'Verified'").get(),
    db.prepare('SELECT COUNT(*) count FROM messages WHERE read_at IS NULL').get(),
    db.prepare("SELECT COUNT(*) count FROM monitoring_records WHERE review_status='Pending Review'").get(),
  ])
  const counts = Object.fromEntries(countRows.map(x => [x.status, x.count]))
  const statistics = {
    users: users.count,
    availablePets: availablePets.count,
    adoptedPets: adoptedPets.count,
    total: total.count,
    submitted: counts.Submitted || 0,
    underReview: counts['Under Review'] || 0,
    approved: counts['Approved — Awaiting Placement'] || 0,
    rejected: counts.Rejected || 0,
    cancelled: counts['Cancelled by Applicant'] || 0,
    completed: counts['Adoption Completed'] || 0,
    healthPending: healthPending.count,
    unreadMessages: unreadMessages.count,
    pendingMonitoring: pendingMonitoring.count,
  }
  res.status(200).json({ applications, statistics })
}
