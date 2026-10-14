import { db } from '../../../server/db'
import { createSession, publicUser, verifyPassword } from '../../../server/auth'
import { authenticateEnvironmentAdmin } from '../../../server/environmentAdmin'
import { clean, method, validEmail } from '../../../server/http'
export default async function handler(req,res){
  if(!method(req,res,['POST']))return
  const email=clean(req.body?.email).toLowerCase(),password=String(req.body?.password||'')
  if(!validEmail(email)||!password)return res.status(400).json({error:'Enter a valid email address and password.'})
  try{
    const environmentAdmin=await authenticateEnvironmentAdmin(email,password)
    if(environmentAdmin){await createSession(res,environmentAdmin.id);return res.status(200).json({user:environmentAdmin})}
    if(environmentAdmin===false)return res.status(401).json({error:'Invalid email address or password.'})
    const user=await db.prepare('SELECT * FROM users WHERE email=?').get(email)
    if(!user||user.role==='ADMIN'||!(await verifyPassword(password,user.password_hash)))return res.status(401).json({error:'Invalid email address or password.'})
    await createSession(res,user.id)
    return res.status(200).json({user:publicUser(user)})
  }catch(error){
    console.error('Login configuration error:',error)
    return res.status(500).json({error:'Administrator login is not configured correctly.'})
  }
}

