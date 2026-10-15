import { db } from '../../server/db'
import { method } from '../../server/http'

export default async function handler(req,res){
  if(!method(req,res,['GET']))return
  res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=60')
  const pets=await db.prepare("SELECT id,name,image,type,breed,age,gender,fixed_status fixedStatus,vaccination_status vaccinationStatus,health_notes healthNotes,description,availability FROM pets WHERE availability='Available' AND published=1 AND health_verification='Verified' ORDER BY created_at").all()
  return res.status(200).json({pets})
}
