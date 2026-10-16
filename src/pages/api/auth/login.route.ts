import { db } from '../../../server/db'
import { createSession, mobileSession, publicUser, verifyPassword } from '../../../server/auth'
import { authenticateEnvironmentAdmin } from '../../../server/environmentAdmin'
import { clean, method, validEmail } from '../../../server/http'
export default async function handler(req,res){
  if(!method(req,res,['POST']))return
  const email=clean(req.body?.email).toLowerCase(),password=String(req.body?.password||'')
  if(!validEmail(email)||!password)return res.status(400).json({error:'Enter a valid email address and password.'})
  try{
    const environmentAdmin=await authenticateEnvironmentAdmin(email,password)
    if(environmentAdmin){const token=await createSession(res,environmentAdmin.id);return res.status(200).json({user:environmentAdmin,...mobileSession(req,token)})}
    if(environmentAdmin===false)return res.status(401).json({error:'Invalid email address or password.'})
    const user=await db.prepare('SELECT * FROM users WHERE email=? AND deleted_at IS NULL').get(email)
    if(!user||user.role==='ADMIN'||!(await verifyPassword(password,user.password_hash)))return res.status(401).json({error:'Invalid email address or password.'})
    if(user.account_status!=='active')return res.status(403).json({error:'This account is not currently active. Contact WHELPS support if you believe this is a mistake.'})
    const token=await createSession(res,user.id)
    return res.status(200).json({user:publicUser(user),...mobileSession(req,token)})
  }catch(error){
    console.error('Login configuration error:',error)
    return res.status(500).json({error:'Administrator login is not configured correctly.'})
  }
}

