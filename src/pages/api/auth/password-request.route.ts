import crypto from 'node:crypto'
import { db } from '../../../server/db'
import { clean, method, validEmail } from '../../../server/http'
const digest=value=>crypto.createHash('sha256').update(value).digest('hex')
export default async function handler(req,res){
  if(!method(req,res,['POST']))return
  const email=clean(req.body?.email).toLowerCase();if(!validEmail(email))return res.status(400).json({error:'Enter a valid email address.'})
  const user=await db.prepare("SELECT id,email FROM users WHERE email=? AND role='USER' AND deleted_at IS NULL").get(email)
  if(user){const token=crypto.randomBytes(32).toString('base64url'),expires=new Date(Date.now()+30*60*1000).toISOString();await db.prepare('DELETE FROM password_reset_tokens WHERE user_id=? OR expires_at<?').run(user.id,new Date().toISOString());await db.prepare('INSERT INTO password_reset_tokens (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').run(digest(token),user.id,expires,new Date().toISOString());const origin=String(process.env.NEXT_PUBLIC_SITE_URL||`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`),resetUrl=`${origin}/reset-password?token=${encodeURIComponent(token)}`;if(process.env.RESEND_API_KEY&&process.env.WHELPS_FROM_EMAIL){await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.WHELPS_FROM_EMAIL,to:[email],subject:'Reset your WHELPS password',html:`<p>A password reset was requested for your WHELPS account.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes.</p>`})})}else if(process.env.NODE_ENV!=='production')return res.status(200).json({message:'Reset link created for local development.',resetUrl})}
  res.status(200).json({message:'If that account exists, a password-reset email has been sent.'})
}
