import { requireUser } from '../../../../server/auth'
import { method } from '../../../../server/http'
export default async function handler(req,res){if(!method(req,res,['POST']))return;if(!await requireUser(req,res))return;res.status(503).json({error:'Private attachment storage is not configured. Configure an authenticated object-storage provider before enabling JPG, PNG, or WebP uploads.'})}

