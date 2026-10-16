import { db, makeId } from '../../../server/db'
import { requireUser } from '../../../server/auth'
import { clean, method } from '../../../server/http'
import { audit } from '../../../server/audit'
import { notify } from '../../../server/applications'

export default async function handler(req,res){
  if(!method(req,res,['GET','PATCH']))return
  const admin=await requireUser(req,res,'ADMIN');if(!admin)return
  if(req.method==='GET'){
    const [users,rehoming,verifications,reports,audits]=await Promise.all([
      db.prepare("SELECT id,name,email,phone,region,city,account_status accountStatus,verification_status verificationStatus,organization_name organizationName,created_at createdAt FROM users WHERE role='USER' AND deleted_at IS NULL ORDER BY created_at DESC").all(),
      db.prepare('SELECT id,pet_name petName,species,breed,age_months ageMonths,sex,size,location,vaccination_status vaccinationStatus,fixed_status fixedStatus,health_notes healthNotes,personality,compatibility,reason,carer_name carerName,carer_email carerEmail,carer_phone carerPhone,relationship,image_data imageData,status,review_note reviewNote,submitted_at submittedAt FROM rehoming_submissions ORDER BY submitted_at DESC').all(),
      db.prepare("SELECT id,name,email,organization_name organizationName,verification_status verificationStatus FROM users WHERE verification_status<>'not_requested' ORDER BY name").all(),
      db.prepare('SELECT r.*,r.resolution_note resolutionNote,r.created_at createdAt,u.name reporterName FROM welfare_reports r LEFT JOIN users u ON u.id=r.reported_by ORDER BY r.created_at DESC').all(),
      db.prepare('SELECT a.id,a.action_type actionType,a.entity_type entityType,a.entity_id entityId,a.details,a.created_at createdAt,u.name actorName FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 100').all(),
    ]);return res.status(200).json({users,rehoming,verifications,reports,audits})
  }
  const action=clean(req.body?.action),id=clean(req.body?.id),reason=clean(req.body?.reason),now=new Date().toISOString()
  if(!id||!action)return res.status(400).json({error:'Choose a record and action.'})
  if(action==='user_status'){const status=clean(req.body?.status);if(!['active','suspended','banned'].includes(status)||!reason)return res.status(400).json({error:'Choose a status and provide a reason.'});await db.prepare('UPDATE users SET account_status=? WHERE id=? AND role=\'USER\'').run(status,id);if(status!=='active')await db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);await audit(admin.id,'USER_STATUS','user',id,{status,reason})}
  else if(action==='verification'){const status=clean(req.body?.status);if(!['verified','rejected'].includes(status)||!reason)return res.status(400).json({error:'Choose a decision and provide a reason.'});await db.prepare('UPDATE users SET verification_status=? WHERE id=?').run(status,id);await notify(id,null,'VERIFICATION_UPDATE',`Your organization verification was ${status}. ${reason}`);await audit(admin.id,'VERIFICATION_DECISION','user',id,{status,reason})}
  else if(action==='rehoming'){const status=clean(req.body?.status);if(!['Under Review','Additional Information Required','Approved','Rejected'].includes(status))return res.status(400).json({error:'Choose a valid review status.'});const row=await db.prepare('SELECT * FROM rehoming_submissions WHERE id=?').get(id);if(!row)return res.status(404).json({error:'Rehoming submission not found.'});await db.transaction(async()=>{await db.prepare('UPDATE rehoming_submissions SET status=?,review_note=?,updated_at=? WHERE id=?').run(status,reason||null,now,id);if(status==='Approved'&&row.status!=='Approved'){await db.prepare(`INSERT INTO pets (id,name,image,type,breed,age,gender,fixed_status,vaccination_status,health_notes,health_verification,description,availability,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(makeId('PET'),row.pet_name,row.image_data,row.species,row.breed,`${row.age_months} months`,row.sex,row.fixed_status,row.vaccination_status,row.health_notes,'Pending Verification',`${row.personality}\n\nCompatibility: ${row.compatibility}`,'Available',0,now,now)}await notify(row.submitted_by,null,'REHOMING_UPDATE',`Your rehoming submission for ${row.pet_name} is now ${status}. ${reason||''}`);await audit(admin.id,'REHOMING_REVIEW','rehoming',id,{status,reason})})();}
  else if(action==='report'){const status=clean(req.body?.status);if(!['under_review','resolved','dismissed'].includes(status)||!reason)return res.status(400).json({error:'Choose a status and enter investigation notes.'});const row=await db.prepare('SELECT reported_by reportedBy FROM welfare_reports WHERE id=?').get(id);await db.prepare('UPDATE welfare_reports SET status=?,resolution_note=?,resolved_by=?,updated_at=? WHERE id=?').run(status,reason,admin.id,now,id);if(row?.reportedBy)await notify(row.reportedBy,null,'REPORT_UPDATE',`Your animal-welfare report is now ${status.replaceAll('_',' ')}. ${reason}`);await audit(admin.id,'REPORT_REVIEW','report',id,{status,reason})}
  else return res.status(400).json({error:'Unsupported administrator action.'})
  res.status(200).json({ok:true})
}
