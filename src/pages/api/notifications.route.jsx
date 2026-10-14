import { db } from '../../server/db'
import { requireUser } from '../../server/auth'
import { method } from '../../server/http'
export default function handler(req,res){if(!method(req,res,['GET']))return;const user=requireUser(req,res);if(!user)return;res.status(200).json({notifications:db.prepare('SELECT id,application_id applicationId,conversation_id conversationId,type,message,is_read isRead,created_at createdAt FROM notifications WHERE recipient_user_id=? ORDER BY created_at DESC LIMIT 50').all(user.id)})}
