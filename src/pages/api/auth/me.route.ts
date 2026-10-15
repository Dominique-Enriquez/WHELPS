import { db } from '../../../server/db'
import { getSessionUser, hashPassword, publicUser, requireUser, verifyPassword } from '../../../server/auth'
import { clean, method, validEmail, validPhone } from '../../../server/http'

export default async function handler(req,res){
  if(!method(req,res,['GET','PATCH']))return
  if(req.method==='GET')return res.status(200).json({user:publicUser(await getSessionUser(req))})

  const sessionUser=await requireUser(req,res)
  if(!sessionUser)return
  const name=clean(req.body?.name),email=clean(req.body?.email).toLowerCase(),phone=clean(req.body?.phone),region=clean(req.body?.region),city=clean(req.body?.city)
  const currentPassword=String(req.body?.currentPassword||''),newPassword=String(req.body?.newPassword||'')
  if(!name||!validEmail(email)||!validPhone(phone)||!region||!city)return res.status(400).json({error:'Complete every profile field using a valid email and Philippine mobile number.'})
  if(newPassword&&newPassword.length<12)return res.status(400).json({error:'Your new password must contain at least 12 characters.'})
  if(newPassword&&!currentPassword)return res.status(400).json({error:'Enter your current password before choosing a new password.'})

  const duplicate=await db.prepare('SELECT 1 FROM users WHERE email=? AND id<>?').get(email,sessionUser.id)
  if(duplicate)return res.status(409).json({error:'Another account already uses this email address.'})
  if(newPassword){
    const account=await db.prepare('SELECT password_hash FROM users WHERE id=?').get(sessionUser.id)
    if(!account||!(await verifyPassword(currentPassword,account.password_hash)))return res.status(401).json({error:'Your current password is incorrect.'})
  }

  try{
    if(newPassword)await db.prepare('UPDATE users SET name=?,email=?,phone=?,region=?,city=?,password_hash=? WHERE id=?').run(name,email,phone,region,city,await hashPassword(newPassword),sessionUser.id)
    else await db.prepare('UPDATE users SET name=?,email=?,phone=?,region=?,city=? WHERE id=?').run(name,email,phone,region,city,sessionUser.id)
  }catch(error){
    if(error?.code==='23505')return res.status(409).json({error:'Another account already uses this email address.'})
    throw error
  }
  const updated=await db.prepare('SELECT id,name,email,role,phone,region,city FROM users WHERE id=?').get(sessionUser.id)
  return res.status(200).json({user:publicUser(updated),message:newPassword?'Profile and password updated.':'Profile updated.'})
}

