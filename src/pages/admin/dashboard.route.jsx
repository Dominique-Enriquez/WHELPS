export { default } from '../AdminDashboard'
import { adminPageProps } from '../../server/pageAuth'
import { getAdminDashboardData } from '../../server/adminDashboard'

export async function getServerSideProps(context){
  const auth=await adminPageProps(context)
  if(auth.redirect)return auth
  try{
    const initialData=await getAdminDashboardData()
    return {props:{...auth.props,initialData:JSON.parse(JSON.stringify(initialData))}}
  }catch(error){
    console.error('Admin dashboard server load failed:',error)
    return {props:{...auth.props,initialData:null,initialError:'Dashboard data could not be loaded from PostgreSQL.'}}
  }
}
