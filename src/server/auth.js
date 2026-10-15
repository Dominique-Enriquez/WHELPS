import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { db } from './db.js'

const scrypt = promisify(crypto.scrypt)
const COOKIE = 'whelps_session'
const DAYS = 7

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [, salt, expected] = String(stored).split(':')
  if (!salt || !expected) return false
  const actual = await scrypt(password, salt, 64)
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual))
}

const digest = token => crypto.createHash('sha256').update(token).digest('hex')
const readCookie = (req, name) => Object.fromEntries(String(req.headers.cookie || '').split(';').map(x => x.trim().split('=').map(decodeURIComponent)).filter(x => x.length === 2))[name]
const readBearer = req => {
  const match = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ''))
  return match?.[1] || null
}
const readSessionToken = req => readBearer(req) || readCookie(req, COOKIE)

export async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url')
  const now = new Date()
  const expires = new Date(now.getTime() + DAYS * 86400000)
  await db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now.toISOString())
  await db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(digest(token), userId, expires.toISOString(), now.toISOString())
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
  return token
}

export async function clearSession(req, res) {
  const token = readSessionToken(req)
  if (token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token))
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
}

export async function getSessionUser(req) {
  const token = readSessionToken(req)
  if (!token) return null
  return (await db.prepare(`SELECT u.id,u.name,u.email,u.role,u.phone,u.region,u.city FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(digest(token), new Date().toISOString())) || null
}

export async function requireUser(req, res, role) {
  const user = await getSessionUser(req)
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' })
    return null
  }
  if (role && user.role !== role) {
    res.status(403).json({ error: 'You do not have permission to perform this action.' })
    return null
  }
  return user
}

export const publicUser = user => user && ({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, region: user.region, city: user.city })
export const mobileSession = (req, token) => String(req.headers['x-whelps-client'] || '').toLowerCase() === 'mobile' ? { sessionToken: token } : {}
