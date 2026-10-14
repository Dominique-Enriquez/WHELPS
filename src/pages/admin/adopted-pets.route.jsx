import AdminPets from '../AdminPets'
export default function AdoptedPets(){return <AdminPets adopted/>}
export { adminPageProps as getServerSideProps } from '../../server/pageAuth'
