import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import '../styles.css'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider initialUser={pageProps.serverUser || null}>
      <Head>
        <title>FurYou × Whelps</title>
        <meta name="description" content="FurYou × Whelps pet adoption and animal welfare platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <RouteGuard><Component {...pageProps} /></RouteGuard>
    </AuthProvider>
  )
}

function RouteGuard({ children }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const adminRoute = router.pathname.startsWith('/admin/')
  const userRoute = router.pathname === '/dashboard'
  const wrongRole = adminRoute ? user?.role !== 'ADMIN' : userRoute ? user?.role !== 'USER' : false

  useEffect(() => {
    if (loading || (!adminRoute && !userRoute) || !wrongRole) return
    if (!user) router.replace('/login?next=' + encodeURIComponent(router.asPath))
    else router.replace(user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')
  }, [adminRoute, loading, router, user, userRoute, wrongRole])

  if (!loading && (adminRoute || userRoute) && wrongRole) return <div className="min-h-screen bg-mist" aria-busy="true" />
  return children
}
