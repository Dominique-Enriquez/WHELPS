import Head from 'next/head'
import { AuthProvider } from '../context/AuthContext'
import '../styles.css'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>FurYou × Whelps</title>
        <meta name="description" content="FurYou × Whelps pet adoption and animal welfare platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
