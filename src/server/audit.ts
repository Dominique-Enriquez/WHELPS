import { db } from './db'

export async function audit(actorUserId, actionType, entityType, entityId = null, details = {}) {
  await db.prepare('INSERT INTO audit_logs (actor_user_id,action_type,entity_type,entity_id,details,created_at) VALUES (?,?,?,?,?::jsonb,?)')
    .run(actorUserId, actionType, entityType, entityId, JSON.stringify(details), new Date().toISOString())
}
