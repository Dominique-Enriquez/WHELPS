const configuredOrigins=()=>String(process.env.MOBILE_APP_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean)
const isAllowedOrigin=origin=>!origin||configuredOrigins().includes(origin)||/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)

function applyCors(req,res){
  const origin=String(req.headers.origin||'')
  if(origin&&isAllowedOrigin(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin)
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-Whelps-Client')
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Max-Age','86400')
    res.setHeader('Vary','Origin')
  }
}

export function method(req,res,allowed){
  applyCors(req,res)
  if(req.method==='OPTIONS'){
    if(!isAllowedOrigin(String(req.headers.origin||'')))return res.status(403).end()
    res.status(204).end()
    return false
  }
  if(!allowed.includes(req.method)){res.setHeader('Allow',allowed);res.status(405).json({error:'Method not allowed.'});return false}
  return true
}
export const clean=value=>typeof value==='string'?value.trim():''
export const validEmail=value=>/^\S+@\S+\.\S+$/.test(clean(value).toLowerCase())
export const validPhone=value=>/^(?:\+63|0)9\d{9}$/.test(clean(value).replace(/[\s-]/g,''))

