import { getSessionUser, publicUser } from '../../../server/auth'
import { method } from '../../../server/http'
export default function handler(req,res){if(!method(req,res,['GET']))return;res.status(200).json({user:publicUser(getSessionUser(req))})}

