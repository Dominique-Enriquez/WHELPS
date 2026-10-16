import { db, makeId } from '../../server/db'
import { requireUser } from '../../server/auth'
import { clean, method, validEmail, validPhone } from '../../server/http'
import { notify } from '../../server/applications'

const image=/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
export const config={api:{bodyParser:{sizeLimit:'5mb'}}}
export default async function handler(req,res){
  if(!method(req,res,['GET','POST','PATCH']))return
  const user=await requireUser(req,res,'USER');if(!user)return
  if(req.method==='GET')return res.status(200).json({submissions:await db.prepare('SELECT *,pet_name petName,age_months ageMonths,vaccination_status vaccinationStatus,fixed_status fixedStatus,health_notes healthNotes,review_note reviewNote,submitted_at submittedAt,updated_at updatedAt FROM rehoming_submissions WHERE submitted_by=? ORDER BY submitted_at DESC').all(user.id)})
  if(req.method==='PATCH'){const id=clean(req.body?.id),row=await db.prepare('SELECT status FROM rehoming_submissions WHERE id=? AND submitted_by=?').get(id,user.id);if(!row)return res.status(404).json({error:'Submission not found.'});if(!['Submitted','Additional Information Required'].includes(row.status))return res.status(409).json({error:'This submission can no longer be cancelled.'});await db.prepare("UPDATE rehoming_submissions SET status='Cancelled',updated_at=? WHERE id=?").run(new Date().toISOString(),id);return res.status(200).json({ok:true})}
  const b=req.body||{},age=Number(b.ageMonths),fields={petName:clean(b.petName),species:clean(b.species),breed:clean(b.breed),sex:clean(b.sex),size:clean(b.size),location:clean(b.location),vaccinationStatus:clean(b.vaccinationStatus),fixedStatus:clean(b.fixedStatus),healthNotes:clean(b.healthNotes),personality:clean(b.personality),compatibility:clean(b.compatibility),reason:clean(b.reason),carerName:clean(b.carerName),carerEmail:clean(b.carerEmail).toLowerCase(),carerPhone:clean(b.carerPhone),relationship:clean(b.relationship),imageData:clean(b.imageData)}
  if(Object.entries(fields).some(([key,value])=>!value&&!['healthNotes'].includes(key))||!Number.isInteger(age)||age<0||age>600||!validEmail(fields.carerEmail)||!validPhone(fields.carerPhone)||fields.reason.length>1000||fields.imageData.length>4*1024*1024||!image.test(fields.imageData))return res.status(400).json({error:'Complete every required field and attach a JPG, PNG, or WebP photo under 3 MB.'})
  const id=makeId('RHM'),now=new Date().toISOString()
  await db.prepare(`INSERT INTO rehoming_submissions (id,submitted_by,pet_name,species,breed,age_months,sex,size,location,vaccination_status,fixed_status,health_notes,personality,compatibility,reason,carer_name,carer_email,carer_phone,relationship,image_data,status,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,user.id,fields.petName,fields.species,fields.breed,age,fields.sex,fields.size,fields.location,fields.vaccinationStatus,fields.fixedStatus,fields.healthNotes||null,fields.personality,fields.compatibility,fields.reason,fields.carerName,fields.carerEmail,fields.carerPhone,fields.relationship,fields.imageData,'Submitted',now,now)
  const admins=await db.prepare("SELECT id FROM users WHERE role='ADMIN'").all();await Promise.all(admins.map(a=>notify(a.id,null,'NEW_REHOMING',`A rehoming submission was received for ${fields.petName}.`)))
  res.status(201).json({id,status:'Submitted'})
}
