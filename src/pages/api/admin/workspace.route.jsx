import { db } from '../../../server/db'
import { requireUser } from '../../../server/auth'
import { method } from '../../../server/http'
import { applicationSelect } from '../../../server/applications'
import { getAdminStatistics } from '../../../server/adminDashboard'

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return
  const user = await requireUser(req, res, 'ADMIN')
  if (!user) return
  res.setHeader('Cache-Control', 'private, no-store')

  const load = async (stage, operation) => {
    try {
      return await operation()
    } catch (error) {
      error.workspaceStage = stage
      throw error
    }
  }

  // Vercel functions use a deliberately small Supabase transaction pool.
  // Keep this request on one connection instead of queueing a burst of
  // concurrent statements against that pool.
  try {
  const applications = await load('applications', () => db.prepare(applicationSelect('', 'a.submitted_at DESC')).all())
  const statistics = await load('statistics', getAdminStatistics)
  const pets = await load('pets', () => db.prepare('SELECT *,fixed_status fixedStatus,vaccination_status vaccinationStatus,health_notes healthNotes,health_verification healthVerification,created_at createdAt,updated_at updatedAt FROM pets ORDER BY updated_at DESC').all())
  const monitoringRecords = await load('monitoring records', () => db.prepare('SELECT m.*,m.placement_id placementId,m.pet_condition petCondition,m.feeding_update feedingUpdate,m.health_observations healthObservations,m.behavior_update behaviorUpdate,m.submitted_at submittedAt,m.review_status reviewStatus,m.admin_notes adminNotes,pl.status placementStatus,p.name petName,p.image petImage,u.name adopterName FROM monitoring_records m JOIN adoption_placements pl ON pl.id=m.placement_id JOIN pets p ON p.id=pl.pet_id JOIN users u ON u.id=pl.adopter_user_id ORDER BY m.submitted_at DESC').all())
  const placements = await load('placements', () => db.prepare("SELECT pl.id,pl.status,p.name petName,p.image petImage,a.status applicationStatus,u.name adopterName FROM adoption_placements pl JOIN adoption_applications a ON a.id=pl.application_id JOIN pets p ON p.id=pl.pet_id JOIN users u ON u.id=pl.adopter_user_id WHERE pl.status='Monitoring' ORDER BY pl.adopted_at DESC").all())
  const conversations = await load('conversations', () => db.prepare('SELECT c.id,c.application_id applicationId,c.adopter_user_id adopterUserId,c.created_at createdAt,c.last_activity_at lastActivityAt,c.closed_at closedAt,u.name adopterName,u.email,p.id petId,p.name petName,p.image petImage,p.breed,a.status,(SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) lastMessage,(SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) lastMessageAt,(SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_user_id<>? AND read_at IS NULL) unreadCount FROM conversations c JOIN users u ON u.id=c.adopter_user_id JOIN adoption_applications a ON a.id=c.application_id JOIN pets p ON p.id=a.pet_id ORDER BY c.last_activity_at DESC').all(user.id))
  const feedback = await load('feedback', () => db.prepare('SELECT COUNT(*) total,COALESCE(ROUND(AVG(rating),2),0) average FROM feedback').get())
  const topics = await load('feedback topics', () => db.prepare('SELECT topic,COUNT(*) submissions,ROUND(AVG(rating),2) average FROM feedback GROUP BY topic ORDER BY average ASC').all())
  const applicationOutcomes = await load('application outcomes', () => db.prepare('SELECT status,COUNT(*) count FROM adoption_applications GROUP BY status').all())
  const completed = await load('completed adoptions', () => db.prepare('SELECT COUNT(*) count FROM adoption_placements').get())
  const monitoringActivity = await load('monitoring activity', () => db.prepare('SELECT COUNT(*) count FROM monitoring_records').get())
  const monthlyApplications = await load('monthly applications', () => db.prepare("SELECT to_char(date_trunc('month',submitted_at),'YYYY-MM-01') month,COUNT(*) count FROM adoption_applications WHERE submitted_at>=date_trunc('month',CURRENT_DATE)-INTERVAL '11 months' GROUP BY 1 ORDER BY 1").all())
  const monthlyAdoptions = await load('monthly adoptions', () => db.prepare("SELECT to_char(date_trunc('month',decision_at),'YYYY-MM-01') month,COUNT(*) count FROM adoption_applications WHERE status='Adoption Completed' AND decision_at>=date_trunc('month',CURRENT_DATE)-INTERVAL '11 months' GROUP BY 1 ORDER BY 1").all())

  res.status(200).json({
    applications,
    statistics,
    pets,
    monitoring: { records: monitoringRecords, placements },
    conversations,
    evaluation: {
      feedbackTotal: feedback.total,
      averageRating: feedback.average,
      completedAdoptions: completed.count,
      monitoringActivity: monitoringActivity.count,
      applications: Object.fromEntries(applicationOutcomes.map(item => [item.status, item.count])),
      topics,
      monthlyApplications: monthlyApplications.map(row => ({ ...row, count: Number(row.count) })),
      monthlyAdoptions: monthlyAdoptions.map(row => ({ ...row, count: Number(row.count) })),
    },
  })
  } catch (error) {
    console.error('Admin workspace query failed', error)
    res.status(500).json({
      error: 'The admin workspace could not be loaded.',
      stage: error.workspaceStage || 'unknown',
    })
  }
}
