import { db, makeId } from '../../server/db'
import { requireUser } from '../../server/auth'
import { clean, method } from '../../server/http'
import { history, notify, userStatus } from '../../server/applications'

export default async function handler(req,res){
  if(!method(req,res,['GET','POST','PATCH']))return
  const user=await requireUser(req,res)
  if(!user)return
  res.setHeader('Cache-Control','private, no-store')

  if(req.method==='GET'){
    const where=user.role==='ADMIN'?'':'WHERE pl.adopter_user_id=?'
    const params=user.role==='ADMIN'?[]:[user.id]
    const records=await db.prepare(`SELECT m.*,m.placement_id placementId,m.pet_condition petCondition,m.feeding_update feedingUpdate,m.health_observations healthObservations,m.behavior_update behaviorUpdate,m.submitted_at submittedAt,m.review_status reviewStatus,m.admin_notes adminNotes,pl.status placementStatus,p.name petName,p.image petImage,u.name adopterName FROM monitoring_records m JOIN adoption_placements pl ON pl.id=m.placement_id JOIN pets p ON p.id=pl.pet_id JOIN users u ON u.id=pl.adopter_user_id ${where} ORDER BY m.submitted_at DESC`).all(...params)
    const placementWhere=user.role==='ADMIN'?"WHERE pl.status='Monitoring'":"WHERE pl.adopter_user_id=? AND pl.status='Monitoring'"
    const placements=await db.prepare(`SELECT pl.id,pl.status,p.name petName,p.image petImage,a.status applicationStatus,u.name adopterName FROM adoption_placements pl JOIN adoption_applications a ON a.id=pl.application_id JOIN pets p ON p.id=pl.pet_id JOIN users u ON u.id=pl.adopter_user_id ${placementWhere} ORDER BY pl.adopted_at DESC`).all(...params)
    return res.status(200).json({records,placements})
  }

  if(req.method==='POST'){
    if(user.role!=='USER')return res.status(403).json({error:'Only adopters may submit monitoring updates.'})
    const placementId=clean(req.body?.placementId)
    const placement=await db.prepare("SELECT * FROM adoption_placements WHERE id=? AND adopter_user_id=? AND status='Monitoring'").get(placementId,user.id)
    if(!placement)return res.status(404).json({error:'An active approved placement was not found.'})
    const condition=clean(req.body?.petCondition)
    if(!condition)return res.status(400).json({error:'Describe the pet condition.'})
    const id=makeId('MON')
    await db.prepare(`INSERT INTO monitoring_records (id,placement_id,submitted_by,pet_condition,feeding_update,health_observations,behavior_update,notes,submitted_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(id,placementId,user.id,condition,clean(req.body?.feedingUpdate)||null,clean(req.body?.healthObservations)||null,clean(req.body?.behaviorUpdate)||null,clean(req.body?.notes)||null,new Date().toISOString())
    return res.status(201).json({id})
  }

  if(user.role!=='ADMIN')return res.status(403).json({error:'Administrator access required.'})
  const id=clean(req.body?.id),action=clean(req.body?.action)||'review',reviewStatus=clean(req.body?.reviewStatus)
  if(action==='review'&&!['Reviewed','Needs Clarification'].includes(reviewStatus))return res.status(400).json({error:'Select a valid review status.'})
  if(!['review','complete'].includes(action))return res.status(400).json({error:'Select a valid monitoring action.'})
  const record=await db.prepare(`SELECT m.id,m.review_status reviewStatus,pl.id placementId,pl.application_id applicationId,pl.pet_id petId,a.status applicationStatus,a.applicant_user_id applicantUserId,p.name petName FROM monitoring_records m JOIN adoption_placements pl ON pl.id=m.placement_id JOIN adoption_applications a ON a.id=pl.application_id JOIN pets p ON p.id=pl.pet_id WHERE m.id=?`).get(id)
  if(!record)return res.status(404).json({error:'Monitoring record not found.'})
  const now=new Date().toISOString()
  if(action==='review'){
    await db.prepare('UPDATE monitoring_records SET review_status=?,reviewed_by=?,reviewed_at=?,admin_notes=? WHERE id=?').run(reviewStatus,user.id,now,clean(req.body?.adminNotes)||null,id)
    return res.status(200).json({ok:true,completed:false})
  }
  if(record.reviewStatus!=='Reviewed')return res.status(409).json({error:'Review this monitoring update before completing the adoption.'})
  if(record.applicationStatus!=='Approved — Awaiting Placement')return res.status(409).json({error:'Only an approved application in monitoring can be completed.'})
  await db.transaction(async()=>{
    const latest=userStatus('Adoption Completed',record.petName)
    await db.prepare("UPDATE adoption_applications SET status='Adoption Completed',updated_at=?,latest_update=?,decision_at=?,version=version+1 WHERE id=?").run(now,latest,now,record.applicationId)
    await db.prepare("UPDATE adoption_placements SET status='Completed' WHERE id=?").run(record.placementId)
    await db.prepare("UPDATE pets SET availability='Adopted',published=0,updated_at=? WHERE id=?").run(now,record.petId)
    await history(record.applicationId,record.applicationStatus,'Adoption Completed',user.id,'Monitoring completed and adoption finalized by administrator.')
    await notify(record.applicantUserId,record.applicationId,'ADOPTION_COMPLETED',latest)
  })()
  return res.status(200).json({ok:true,completed:true})
}
