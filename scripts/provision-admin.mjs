import { db, makeId } from '../src/server/db.js'
import { hashPassword } from '../src/server/auth.js'
const name=process.env.WHELPS_ADMIN_NAME?.trim(),email=process.env.WHELPS_ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.WHELPS_ADMIN_PASSWORD
if(!name||!email||!password||password.length<12){console.error('Set WHELPS_ADMIN_NAME, WHELPS_ADMIN_EMAIL, and WHELPS_ADMIN_PASSWORD (12+ characters).');process.exit(1)}
const existing=await db.prepare('SELECT id,role FROM users WHERE email=?').get(email)
if(existing&&existing.role!=='ADMIN'){console.error('Refusing to elevate a public user account.');process.exit(1)}
const hash=await hashPassword(password)
if(existing)await db.prepare('UPDATE users SET name=?,password_hash=? WHERE id=?').run(name,hash,existing.id)
else await db.prepare('INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)').run(makeId('ADM'),name,email,hash,'ADMIN',new Date().toISOString())
console.log(`Provisioned administrator: ${email}`)
await db.close()
