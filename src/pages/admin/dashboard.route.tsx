import AdminDashboard from '../AdminDashboard'
import { getSessionUser, publicUser } from '../../server/auth'
import { getAdminDashboardData } from '../../server/adminDashboard'

export default AdminDashboard

export async function getServerSideProps({req}) {
  const user=await getSessionUser(req)
  if(!user)return {redirect:{destination:'/login?next=%2Fadmin%2Fdashboard',permanent:false}}
  if(user.role!=='ADMIN')return {redirect:{destination:'/dashboard',permanent:false}}

  return {props:{serverUser:publicUser(user),initialData:await getAdminDashboardData()}}
}
