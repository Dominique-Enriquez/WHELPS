import { requireUser } from '../../../server/auth'
import { getAdminDashboardData } from '../../../server/adminDashboard'
import { method } from '../../../server/http'

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return
  if (!await requireUser(req, res, 'ADMIN')) return

  res.setHeader('Cache-Control', 'private, no-store')
  const data = await getAdminDashboardData()
  res.status(200).json(data)
}
