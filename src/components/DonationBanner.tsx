import Link from 'next/link'
import SiteImage from './SiteImage'

export default function DonationBanner() {
  return <section className="relative isolate flex min-h-64 items-center justify-center overflow-hidden bg-brown text-center text-white"><SiteImage src="/images/story/whelps-cats-feeding.jpg" alt="Whelps shelter cats sharing a meal" className="!absolute inset-0 h-full w-full" sizes="100vw"/><div className="absolute inset-0 bg-black/60"/><div className="relative px-6"><h2 className="font-display text-4xl font-black md:text-5xl">Not ready to adopt, but want to help?</h2><Link className="btn-primary mt-6" href="/donate">Support Whelps</Link></div></section>
}
