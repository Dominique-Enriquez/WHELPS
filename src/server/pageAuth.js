import { getSessionUser } from './auth.js'

export function adminPageProps(context){
  const user=getSessionUser(context.req)
  if(!user)return {redirect:{destination:'/login?next='+encodeURIComponent(context.resolvedUrl),permanent:false}}
  if(user.role!=='ADMIN')return {redirect:{destination:'/403',permanent:false}}
  return {props:{serverUser:{id:user.id,name:user.name,email:user.email,role:user.role}}}
}

export function userPageProps(context){
  const user=getSessionUser(context.req)
  if(!user)return {redirect:{destination:'/login?next='+encodeURIComponent(context.resolvedUrl),permanent:false}}
  if(user.role!=='USER')return {redirect:{destination:'/admin/dashboard',permanent:false}}
  return {props:{serverUser:{id:user.id,name:user.name,email:user.email,role:user.role}}}
}
