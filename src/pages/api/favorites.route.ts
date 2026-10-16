import { db } from '../../server/db'
import { requireUser } from '../../server/auth'
import { clean, method } from '../../server/http'

export default async function handler(req,res){
  if(!method(req,res,['GET','POST','DELETE']))return
  const user=await requireUser(req,res,'USER');if(!user)return
  if(req.method==='GET')return res.status(200).json({pets:await db.prepare(`SELECT p.*,p.fixed_status fixedStatus,p.vaccination_status vaccinationStatus,p.health_notes healthNotes FROM favorite_pets f JOIN pets p ON p.id=f.pet_id WHERE f.user_id=? ORDER BY f.created_at DESC`).all(user.id)})
  const petId=clean(req.body?.petId);if(!petId)return res.status(400).json({error:'Choose a pet.'})
  if(req.method==='DELETE'){await db.prepare('DELETE FROM favorite_pets WHERE user_id=? AND pet_id=?').run(user.id,petId);return res.status(200).json({favorite:false})}
  if(!await db.prepare('SELECT 1 FROM pets WHERE id=?').get(petId))return res.status(404).json({error:'Pet not found.'})
  await db.prepare('INSERT INTO favorite_pets (user_id,pet_id,created_at) VALUES (?,?,?) ON CONFLICT (user_id,pet_id) DO NOTHING').run(user.id,petId,new Date().toISOString())
  res.status(201).json({favorite:true})
}
