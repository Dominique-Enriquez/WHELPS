import { db } from '../../../server/db'
import { requireUser } from '../../../server/auth'
import { method } from '../../../server/http'
import { applicationSelect } from '../../../server/applications'

const emptyArray = "'[]'::json"

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return
  const user = await requireUser(req, res, 'ADMIN')
  if (!user) return
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    const applicationQuery = applicationSelect('', 'a.submitted_at DESC')
    const workspace = await db.prepare(`SELECT
      COALESCE((SELECT json_agg(row_to_json(application_rows)) FROM (${applicationQuery}) application_rows),${emptyArray}) applications,
      (SELECT json_build_object(
        'users',(SELECT COUNT(*) FROM users WHERE role='USER'),
        'availablePets',(SELECT COUNT(*) FROM pets WHERE availability='Available' AND published=1 AND health_verification='Verified'),
        'adoptedPets',(SELECT COUNT(*) FROM pets WHERE availability='Adopted'),
        'total',(SELECT COUNT(*) FROM adoption_applications),
        'submitted',(SELECT COUNT(*) FROM adoption_applications WHERE status='Submitted'),
        'underReview',(SELECT COUNT(*) FROM adoption_applications WHERE status='Under Review'),
        'approved',(SELECT COUNT(*) FROM adoption_applications WHERE status='Approved — Awaiting Placement'),
        'rejected',(SELECT COUNT(*) FROM adoption_applications WHERE status='Rejected'),
        'cancelled',(SELECT COUNT(*) FROM adoption_applications WHERE status='Cancelled by Applicant'),
        'completed',(SELECT COUNT(*) FROM adoption_applications WHERE status='Adoption Completed'),
        'healthPending',(SELECT COUNT(*) FROM pets WHERE health_verification<>'Verified'),
        'unreadMessages',(SELECT COUNT(*) FROM messages m JOIN users sender ON sender.id=m.sender_user_id WHERE m.read_at IS NULL AND sender.role='USER'),
        'pendingMonitoring',(SELECT COUNT(*) FROM monitoring_records WHERE review_status='Pending Review')
      )) statistics,
      COALESCE((SELECT json_agg(row_to_json(pet_rows)) FROM (
        SELECT *,fixed_status fixedStatus,vaccination_status vaccinationStatus,health_notes healthNotes,health_verification healthVerification,created_at createdAt,updated_at updatedAt
        FROM pets ORDER BY updated_at DESC
      ) pet_rows),${emptyArray}) pets,
      COALESCE((SELECT json_agg(row_to_json(record_rows)) FROM (
        SELECT m.*,m.placement_id placementId,m.pet_condition petCondition,m.feeding_update feedingUpdate,m.health_observations healthObservations,m.behavior_update behaviorUpdate,m.submitted_at submittedAt,m.review_status reviewStatus,m.admin_notes adminNotes,pl.status placementStatus,p.name petName,p.image petImage,u.name adopterName
        FROM monitoring_records m
        JOIN adoption_placements pl ON pl.id=m.placement_id
        JOIN pets p ON p.id=pl.pet_id
        JOIN users u ON u.id=pl.adopter_user_id
        ORDER BY m.submitted_at DESC
      ) record_rows),${emptyArray}) monitoringRecords,
      COALESCE((SELECT json_agg(row_to_json(placement_rows)) FROM (
        SELECT pl.id,pl.status,p.name petName,p.image petImage,a.status applicationStatus,u.name adopterName
        FROM adoption_placements pl
        JOIN adoption_applications a ON a.id=pl.application_id
        JOIN pets p ON p.id=pl.pet_id
        JOIN users u ON u.id=pl.adopter_user_id
        WHERE pl.status='Monitoring'
        ORDER BY pl.adopted_at DESC
      ) placement_rows),${emptyArray}) placements,
      COALESCE((SELECT json_agg(row_to_json(conversation_rows)) FROM (
        SELECT c.id,c.application_id applicationId,c.adopter_user_id adopterUserId,c.created_at createdAt,c.last_activity_at lastActivityAt,c.closed_at closedAt,u.name adopterName,u.email,p.id petId,p.name petName,p.image petImage,p.breed,a.status,
          (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) lastMessage,
          (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) lastMessageAt,
          (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_user_id<>? AND read_at IS NULL) unreadCount
        FROM conversations c
        JOIN users u ON u.id=c.adopter_user_id
        JOIN adoption_applications a ON a.id=c.application_id
        JOIN pets p ON p.id=a.pet_id
        ORDER BY c.last_activity_at DESC
      ) conversation_rows),${emptyArray}) conversations,
      (SELECT json_build_object(
        'feedbackTotal',(SELECT COUNT(*) FROM feedback),
        'averageRating',(SELECT COALESCE(ROUND(AVG(rating),2),0) FROM feedback),
        'completedAdoptions',(SELECT COUNT(*) FROM adoption_placements),
        'monitoringActivity',(SELECT COUNT(*) FROM monitoring_records),
        'applications',COALESCE((SELECT json_object_agg(status,count) FROM (SELECT status,COUNT(*) count FROM adoption_applications GROUP BY status) outcomes),'{}'::json),
        'topics',COALESCE((SELECT json_agg(row_to_json(topic_rows)) FROM (SELECT topic,COUNT(*) submissions,ROUND(AVG(rating),2) average FROM feedback GROUP BY topic ORDER BY average ASC) topic_rows),${emptyArray}),
        'monthlyApplications',COALESCE((SELECT json_agg(row_to_json(month_rows)) FROM (SELECT to_char(date_trunc('month',submitted_at),'YYYY-MM-01') AS month,COUNT(*) AS count FROM adoption_applications WHERE submitted_at>=date_trunc('month',CURRENT_DATE)-INTERVAL '11 months' GROUP BY 1 ORDER BY 1) month_rows),${emptyArray}),
        'monthlyAdoptions',COALESCE((SELECT json_agg(row_to_json(month_rows)) FROM (SELECT to_char(date_trunc('month',decision_at),'YYYY-MM-01') AS month,COUNT(*) AS count FROM adoption_applications WHERE status='Adoption Completed' AND decision_at>=date_trunc('month',CURRENT_DATE)-INTERVAL '11 months' GROUP BY 1 ORDER BY 1) month_rows),${emptyArray})
      )) evaluation
    `).get(user.id)

    res.status(200).json({
      applications: workspace.applications,
      statistics: workspace.statistics,
      pets: workspace.pets,
      monitoring: {
        records: workspace.monitoringRecords,
        placements: workspace.placements,
      },
      conversations: workspace.conversations,
      evaluation: workspace.evaluation,
    })
  } catch (error) {
    console.error('Admin workspace query failed', error)
    res.status(500).json({ error: 'The admin workspace could not be loaded.' })
  }
}
