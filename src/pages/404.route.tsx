import Link from 'next/link'
export default function NotFound(){return <main className="grid min-h-screen place-items-center bg-cream p-6 text-center"><div><p className="eyebrow">404</p><h1 className="section-title">This page wandered off.</h1><Link href="/" className="btn-primary mt-6">Return home</Link></div></main>}
