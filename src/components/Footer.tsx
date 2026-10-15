import Link from 'next/link'
import BrandLogo from './BrandLogo'

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-brown/10">
      <div className="site-container py-10 grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div><BrandLogo/><p className="mt-3 max-w-sm text-sm text-warm">Helping rescued dogs and cats find safe, loving homes through thoughtful adoption and lifelong support.</p></div>
        <div><h3 className="font-bold">Explore</h3><div className="mt-3 grid gap-2 text-sm"><Link href="/pets">Adoptable Pets</Link><Link href="/our-story">Our Story</Link><Link href="/success-stories">Success Stories</Link></div></div>
        <div><h3 className="font-bold">Contact</h3><p className="mt-3 text-sm text-warm">Purok 1, Mambangan, San Leonardo, Nueva Ecija</p><p className="text-sm text-warm">0951 718 7064</p></div>
      </div>
      <p className="border-t border-brown/10 py-5 text-center text-xs text-warm">© 2026 FurYou × Whelps Animal Care & Rehabilitation Center. All rights reserved.</p>
    </footer>
  )
}
