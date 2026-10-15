import Image from 'next/image'
import Link from 'next/link'

export default function BrandLogo({ className = '', compact: _compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={`relative block h-12 w-40 shrink-0 ${className}`} aria-label="FurYou and Whelps home">
      <Image src="/images/branding/furyou-whelps-logo.png" alt="FurYou and Whelps" fill sizes="160px" className="object-contain object-left" priority />
    </Link>
  )
}
