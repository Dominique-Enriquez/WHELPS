import { db, makeId } from '../../server/db'
import { requireUser } from '../../server/auth'
import { clean, method } from '../../server/http'
export default function handler(req,res){if(!method(req,res,['POST']))return;const user=requireUser(req,res);if(!user)return;const topic=clean(req.body?.topic),rating=Number(req.body?.rating),comments=clean(req.body?.comments);if(!topic||!Number.isInteger(rating)||rating<1||rating>5)return res.status(400).json({error:'Choose a topic and rating from 1 to 5.'});db.prepare('INSERT INTO feedback (id,submitted_by,topic,rating,comments,created_at) VALUES (?,?,?,?,?,?)').run(makeId('FDB'),user.id,topic,rating,comments||null,new Date().toISOString());res.status(201).json({ok:true})}

