import { CheckCircle2, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ImagePlaceholder from './ImagePlaceholder'
import SiteImage from './SiteImage'
import { useAuth } from '../context/AuthContext'

export default function PetCard({ pet, onDetails, compact = false }) {
  const { user } = useAuth()
  const key = `favorite-${pet.id}`
  const [favorite, setFavorite] = useState(false)
  useEffect(() => { if(!user){setFavorite(localStorage.getItem(key) === '1');return}fetch('/api/favorites').then(r=>r.ok?r.json():Promise.reject()).then(d=>setFavorite((d.pets||[]).some(p=>p.id===pet.id))).catch(()=>{}) }, [key,pet.id,user])
  const toggle = async () => { const next = !favorite; setFavorite(next);if(!user){localStorage.setItem(key,next?'1':'0');return}const response=await fetch('/api/favorites',{method:next?'POST':'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({petId:pet.id})});if(!response.ok)setFavorite(!next) }
  return (
    <article className="pet-card">
      <div className={`relative ${compact ? 'h-48' : 'h-56'}`}>{pet.image ? <SiteImage src={pet.image} alt={`Sample adoptable ${pet.type.toLowerCase()} ${pet.name}`} className="h-full w-full rounded-t-[1.75rem]" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"/> : <ImagePlaceholder className="h-full w-full" rounded="rounded-t-[1.75rem] rounded-b-none"/>}<span className="pet-chip">{pet.breed}</span><button onClick={toggle} className="favorite" aria-label={`${favorite ? 'Remove' : 'Add'} ${pet.name} ${favorite ? 'from' : 'to'} favorites`}><Heart className={favorite ? 'fill-orange text-orange' : ''}/></button></div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-2"><h3 className="font-display text-4xl font-black">{pet.name}</h3><span className="rounded-full bg-mist px-2 py-1 text-[10px] font-bold">{pet.fixed||pet.fixedStatus}</span></div>
        <p className="text-sm text-warm">{pet.gender} · {pet.age}</p>
        <p className="mt-2 flex items-center gap-2 font-bold">{pet.vaccinationStatus||'Vaccinated'} <CheckCircle2 size={17}/></p>
        <p className="mt-2 min-h-16 text-sm leading-relaxed text-warm">{pet.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => onDetails?.(pet)} className="btn-secondary min-h-11 !px-3 text-xs">View Profile</button>
          {user ? <button onClick={() => onDetails?.(pet, true)} className="btn-primary min-h-11 !px-3 text-xs">Apply to Adopt</button> : <Link href="/login" className="btn-primary min-h-11 !px-3 text-xs">Login to Adopt</Link>}
        </div>
      </div>
    </article>
  )
}
