import { db } from '../../../server/db'
import { requireUser } from '../../../server/auth'
import { method } from '../../../server/http'

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return
  if (!await requireUser(req, res, 'ADMIN')) return
  const [feedback, topics, applications, completed, monitoring, monthlyApplications, monthlyAdoptions] = await Promise.all([
    db.prepare('SELECT COUNT(*) total,COALESCE(ROUND(AVG(rating),2),0) average FROM feedback').get(),
    db.prepare('SELECT topic,COUNT(*) submissions,ROUND(AVG(rating),2) average FROM feedback GROUP BY topic ORDER BY average ASC').all(),
    db.prepare('SELECT status,COUNT(*) count FROM adoption_applications GROUP BY status').all(),
    db.prepare('SELECT COUNT(*) count FROM adoption_placements').get(),
    db.prepare('SELECT COUNT(*) count FROM monitoring_records').get(),
    db.prepare("SELECT to_char(date_trunc('month',submitted_at),'YYYY-MM-01') AS month,COUNT(*) AS count FROM adoption_applications WHERE submitted_at>=date_trunc('month',CURRENT_DATE)-INTERVAL '11 months' GROUP BY 1 ORDER BY 1").all(),
    db.prepare("SELECT to_char(date_trunc('month',decision_at),'YYYY-MM-01') AS month,COUNT(*) AS count FROM adoption_applications WHERE status='Adoption Completed' AND decision_at>=date_trunc('month',CURRENT_DATE)-INTERVAL '11 months' GROUP BY 1 ORDER BY 1").all(),
  ])
  res.status(200).json({ metrics: {
    feedbackTotal: feedback.total,
    averageRating: feedback.average,
    completedAdoptions: completed.count,
    monitoringActivity: monitoring.count,
    applications: Object.fromEntries(applications.map(x => [x.status, x.count])),
    topics,
    monthlyApplications: monthlyApplications.map(row => ({...row, count: Number(row.count)})),
    monthlyAdoptions: monthlyAdoptions.map(row => ({...row, count: Number(row.count)})),
  } })
}
