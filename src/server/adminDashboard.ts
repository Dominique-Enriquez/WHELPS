import { db } from './db'
const number=value=>Number(value||0)

export async function getAdminStatistics(){
  const row=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM users WHERE role='USER') users,
    (SELECT COUNT(*) FROM pets WHERE availability='Available' AND published=1 AND health_verification='Verified') availablePets,
    (SELECT COUNT(*) FROM pets WHERE availability='Adopted') adoptedPets,
    (SELECT COUNT(*) FROM adoption_applications) total,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Submitted') submitted,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Under Review') underReview,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Approved — Awaiting Placement') approved,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Rejected') rejected,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Cancelled by Applicant') cancelled,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Adoption Completed') completed,
    (SELECT COUNT(*) FROM pets WHERE health_verification<>'Verified') healthPending,
    (SELECT COUNT(*) FROM messages m JOIN users sender ON sender.id=m.sender_user_id WHERE m.read_at IS NULL AND sender.role='USER') unreadMessages,
    (SELECT COUNT(*) FROM monitoring_records WHERE review_status='Pending Review') pendingMonitoring`).get()
  return Object.fromEntries(Object.entries(row||{}).map(([key,value])=>[key,number(value)]))
}

export async function getAdminDashboardData(){
  const row=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM users WHERE role='USER') users,
    (SELECT COUNT(*) FROM pets WHERE availability='Available' AND published=1 AND health_verification='Verified') availablePets,
    (SELECT COUNT(*) FROM adoption_applications) total,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Submitted') submitted,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Under Review') underReview,
    (SELECT COUNT(*) FROM adoption_applications WHERE status='Adoption Completed') completed,
    (SELECT COUNT(*) FROM pets WHERE health_verification<>'Verified') healthPending,
    (SELECT COUNT(*) FROM messages m JOIN users sender ON sender.id=m.sender_user_id WHERE m.read_at IS NULL AND sender.role='USER') unreadMessages,
    (SELECT COUNT(*) FROM monitoring_records WHERE review_status='Pending Review') pendingMonitoring,
    COALESCE((SELECT json_agg(recent ORDER BY recent."submittedAt" DESC) FROM (
      SELECT a.id,a.full_name "fullName",p.name "petName",a.status,a.submitted_at "submittedAt"
      FROM adoption_applications a
      JOIN pets p ON p.id=a.pet_id
      ORDER BY a.submitted_at DESC
      LIMIT 6
    ) recent),'[]'::json) applications`).get()
  const {applications=[],...statistics}=row||{}
  return {
    applications,
    statistics:Object.fromEntries(Object.entries(statistics).map(([key,value])=>[key,number(value)])),
  }
}
