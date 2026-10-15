import crypto from 'node:crypto'
import { db, makeId } from './db.js'
import { hashPassword, publicUser } from './auth.js'
import { validEmail } from './http.js'

const safeEqual=(left,right)=>crypto.timingSafeEqual(crypto.createHash('sha256').update(left).digest(),crypto.createHash('sha256').update(right).digest())

export function getEnvironmentAdmin(){
  const name=process.env.WHELPS_ADMIN_NAME?.trim()
  const email=process.env.WHELPS_ADMIN_EMAIL?.trim().toLowerCase()
  const password=process.env.WHELPS_ADMIN_PASSWORD
  if(!name&&!email&&!password)return null
  if(!name||!validEmail(email)||!password||password.length<12)throw new Error('WHELPS_ADMIN_NAME, WHELPS_ADMIN_EMAIL, and WHELPS_ADMIN_PASSWORD (12+ characters) must all be configured.')
  return {name,email,password}
}

export async function authenticateEnvironmentAdmin(email,password){
  const configured=getEnvironmentAdmin()
  if(!configured||email!==configured.email)return null
  if(!safeEqual(password,configured.password))return false
  const existing=await db.prepare('SELECT id,role FROM users WHERE email=?').get(configured.email)
  if(existing&&existing.role!=='ADMIN')throw new Error('WHELPS_ADMIN_EMAIL belongs to an adopter account. Configure a different administrator email.')
  if(existing)await db.prepare('UPDATE users SET name=? WHERE id=?').run(configured.name,existing.id)
  else await db.prepare('INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)').run(makeId('ADM'),configured.name,configured.email,await hashPassword(configured.password),'ADMIN',new Date().toISOString())
  const admin=await db.prepare('SELECT id,name,email,role,phone,region,city FROM users WHERE email=?').get(configured.email)
  return publicUser(admin)
}
