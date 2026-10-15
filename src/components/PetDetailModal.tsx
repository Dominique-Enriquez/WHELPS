import { CheckCircle2, Heart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ImagePlaceholder from './ImagePlaceholder'
import SiteImage from './SiteImage'
import AdoptionApplication from './AdoptionApplication'
import { useAuth } from '../context/AuthContext'

export default function PetDetailModal({ pet, initialApply = false, onClose }) {
  const { user } = useAuth()
  const [apply, setApply] = useState(initialApply)
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const key=e=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key)}},[onClose])
  if (!pet) return null
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pet-title">
    <div className={`modal-panel ${apply ? 'max-w-7xl' : ''}`}>
      <button onClick={onClose} className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-white shadow-md sm:right-5 sm:top-5" aria-label="Close"><X/></button>
      <div className={`grid min-w-0 ${apply ? 'lg:grid-cols-[300px_minmax(0,1fr)]' : 'md:grid-cols-2'}`}>
        <aside className={apply ? 'bg-cream p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8' : ''}>
          {pet.image ? <SiteImage src={pet.image} alt={`Sample portrait of ${pet.name}`} className={`${apply ? 'h-52 rounded-2xl sm:h-64 sm:rounded-3xl' : 'h-72 min-h-72 rounded-t-2xl sm:rounded-t-3xl md:h-full md:rounded-l-3xl md:rounded-r-none'}`} sizes="(max-width: 768px) 100vw, 50vw"/> : <ImagePlaceholder className="min-h-72 h-full" rounded="rounded-t-3xl md:rounded-l-3xl md:rounded-r-none"/>}
          {apply && <div className="mt-5"><p className="eyebrow">Selected Pet</p><h2 id="pet-title" className="font-display text-4xl font-black">{pet.name}</h2><p className="text-sm text-warm">{pet.breed} · {pet.gender} · {pet.age} · {pet.fixed}</p><p className="mt-4 text-sm leading-relaxed text-warm">{pet.description}</p></div>}
        </aside>
        {!apply ? <div className="p-5 pt-16 sm:p-7 sm:pt-16 md:p-10"><p className="eyebrow">{pet.breed}</p><h2 id="pet-title" className="section-title">Meet {pet.name}</h2><p className="mt-2 text-warm">{pet.gender} · {pet.age} · {pet.fixed}</p><p className="mt-5 leading-relaxed">{pet.description}</p><div className="mt-5 grid gap-2 text-sm"><p className="flex gap-2"><CheckCircle2 size={18} className="shrink-0 text-orange"/>Vaccinated and health checked</p><p><strong>Personality:</strong> Affectionate, curious, and ready to bond.</p><p><strong>Adoption needs:</strong> A safe home, daily care, patience, and a lifelong commitment.</p></div><div className="mt-6 grid gap-2 sm:flex"><button className="btn-secondary min-h-11"><Heart size={16}/> Favorite</button>{user ? <button onClick={() => setApply(true)} className="btn-primary min-h-11">Apply to Adopt</button> : <Link href="/login" className="btn-primary min-h-11">Login to Apply</Link>}</div></div> : <div className="min-w-0 bg-mist p-3 pt-5 sm:p-6 md:p-8"><AdoptionApplication pet={pet} user={user} onCancel={()=>setApply(false)}/></div>}
      </div>
    </div>
  </div>
}
