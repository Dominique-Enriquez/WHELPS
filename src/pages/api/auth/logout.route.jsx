import { clearSession } from '../../../server/auth'
import { method } from '../../../server/http'
export default async function handler(req,res){if(!method(req,res,['POST']))return;await clearSession(req,res);res.status(200).json({ok:true})}

