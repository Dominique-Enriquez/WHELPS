import { db } from '../../../server/db'
import { createSession, publicUser, verifyPassword } from '../../../server/auth'
import { clean, method, validEmail } from '../../../server/http'
export default async function handler(req,res){if(!method(req,res,['POST']))return;const email=clean(req.body?.email).toLowerCase(),password=String(req.body?.password||'');if(!validEmail(email)||!password)return res.status(400).json({error:'Enter a valid email address and password.'});const user=await db.prepare('SELECT * FROM users WHERE email=?').get(email);if(!user||!(await verifyPassword(password,user.password_hash)))return res.status(401).json({error:'Invalid email address or password.'});await createSession(res,user.id);res.status(200).json({user:publicUser(user)})}

