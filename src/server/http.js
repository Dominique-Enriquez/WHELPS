export function method(req,res,allowed){if(!allowed.includes(req.method)){res.setHeader('Allow',allowed);res.status(405).json({error:'Method not allowed.'});return false}return true}
export const clean=value=>typeof value==='string'?value.trim():''
export const validEmail=value=>/^\S+@\S+\.\S+$/.test(clean(value).toLowerCase())
export const validPhone=value=>/^(?:\+63|0)9\d{9}$/.test(clean(value).replace(/[\s-]/g,''))

