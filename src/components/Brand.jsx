import { PawPrint } from 'lucide-react'
import Link from 'next/link'

export default function Brand({ light = false }) {
  return (
    <Link href="/" className={`brand ${light ? 'text-white' : 'text-ink'}`} aria-label="FurYou and Whelps home">
      <span>Fur<span className="text-orange">You</span></span>
      <span className="text-sm font-body">&</span>
      <PawPrint className="text-orange" size={24} />
      <span className="text-xs font-body font-bold tracking-wide">WHELPS</span>
    </Link>
  )
}
