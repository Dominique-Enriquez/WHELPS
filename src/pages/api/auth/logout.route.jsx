import { clearSession } from '../../../server/auth'
import { method } from '../../../server/http'
export default function handler(req,res){if(!method(req,res,['POST']))return;clearSession(req,res);res.status(200).json({ok:true})}

