import { getSessionUser, publicUser } from '../../../server/auth'
import { method } from '../../../server/http'
export default async function handler(req,res){if(!method(req,res,['GET']))return;res.status(200).json({user:publicUser(await getSessionUser(req))})}

