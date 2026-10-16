import { db, makeId } from '../../../../server/db'
import { requireUser } from '../../../../server/auth'
import { clean, method } from '../../../../server/http'

const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp'])
export const config={api:{bodyParser:{sizeLimit:'7mb'}}}
export default async function handler(req,res){
  if(!method(req,res,['GET','POST','DELETE']))return
  const user=await requireUser(req,res);if(!user)return
  const applicationId=clean(req.query.id),application=await db.prepare('SELECT applicant_user_id applicantUserId FROM adoption_applications WHERE id=?').get(applicationId)
  if(!application)return res.status(404).json({error:'Application not found.'})
  if(user.role!=='ADMIN'&&application.applicantUserId!==user.id)return res.status(403).json({error:'You do not have access to these documents.'})
  if(req.method==='GET'){const documentId=clean(req.query.document);if(documentId){const document=await db.prepare('SELECT id,original_name originalName,mime_type mimeType,file_size fileSize,data_base64 dataBase64 FROM application_documents WHERE id=? AND application_id=?').get(documentId,applicationId);if(!document)return res.status(404).json({error:'Document not found.'});return res.status(200).json({document})}return res.status(200).json({documents:await db.prepare('SELECT id,original_name originalName,mime_type mimeType,file_size fileSize,created_at createdAt FROM application_documents WHERE application_id=? ORDER BY created_at').all(applicationId)})}
  if(req.method==='DELETE'){const id=clean(req.body?.id);await db.prepare('DELETE FROM application_documents WHERE id=? AND application_id=?').run(id,applicationId);return res.status(200).json({ok:true})}
  if(user.role!=='USER')return res.status(403).json({error:'Only the applicant may upload supporting documents.'})
  const originalName=clean(req.body?.originalName),mimeType=clean(req.body?.mimeType),data=clean(req.body?.dataBase64),match=/^data:[^;]+;base64,(.+)$/.exec(data),bytes=match?Buffer.from(match[1],'base64'):null
  if(!originalName||!allowed.has(mimeType)||!bytes||bytes.length<1||bytes.length>5*1024*1024)return res.status(400).json({error:'Choose a PDF, JPG, PNG, or WebP file no larger than 5 MB.'})
  const count=Number((await db.prepare('SELECT COUNT(*) count FROM application_documents WHERE application_id=?').get(applicationId))?.count||0);if(count>=3)return res.status(409).json({error:'You can attach up to three supporting documents.'})
  const id=makeId('DOC');await db.prepare('INSERT INTO application_documents (id,application_id,uploaded_by,original_name,mime_type,file_size,data_base64,created_at) VALUES (?,?,?,?,?,?,?,?)').run(id,applicationId,user.id,originalName,mimeType,bytes.length,data,new Date().toISOString());res.status(201).json({document:{id,originalName,mimeType,fileSize:bytes.length}})
}
