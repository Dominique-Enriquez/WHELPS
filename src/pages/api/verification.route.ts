import { db } from '../../server/db'
import { requireUser } from '../../server/auth'
import { clean, method } from '../../server/http'
export default async function handler(req,res){if(!method(req,res,['GET','POST']))return;const user=await requireUser(req,res,'USER');if(!user)return;if(req.method==='GET')return res.status(200).json({status:user.verification_status||'not_requested',organizationName:user.organization_name||''});const organization=clean(req.body?.organizationName);if(!organization)return res.status(400).json({error:'Enter your rescue, shelter, or organization name.'});await db.prepare("UPDATE users SET organization_name=?,verification_status='pending' WHERE id=?").run(organization,user.id);res.status(200).json({status:'pending'})}
