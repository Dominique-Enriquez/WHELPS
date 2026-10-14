import { db } from '../../../../server/db'
import { requireUser } from '../../../../server/auth'
import { clean, method } from '../../../../server/http'
import { applicationSelect } from '../../../../server/applications'
import { getAdminStatistics } from '../../../../server/adminDashboard'

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return
  if (!await requireUser(req, res, 'ADMIN')) return
  res.setHeader('Cache-Control', 'private, no-store')

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
  const [applications, statistics] = await Promise.all([
    db.prepare(applicationSelect(where, sort)).all(...params),
    getAdminStatistics(),
  ])
  res.status(200).json({ applications, statistics })
}
