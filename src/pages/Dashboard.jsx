import { Bell, Heart, Home, LogOut, Menu, MessageSquare, Search, Settings, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import BrandLogo from '../components/BrandLogo'
import MessagingPanel from '../components/MessagingPanel'
import PetCard from '../components/PetCard'
import PetDetailModal from '../components/PetDetailModal'
import SiteImage from '../components/SiteImage'
import UserSettings from '../components/UserSettings'
import { pets } from '../data/pets'
import { useAuth } from '../context/AuthContext'

const cancellable=['Submitted','Under Review','Additional Information Required','Approved — Awaiting Placement']
const links=[[Home,'pets','Adoptable Pets'],[Heart,'applications','Applications'],[MessageSquare,'messages','Messages'],[Settings,'settings','Settings']]

export default function Dashboard(){
  const [open,setOpen]=useState(false),[detail,setDetail]=useState(null),[apply,setApply]=useState(false),[applications,setApplications]=useState([]),[confirm,setConfirm]=useState(null),[notice,setNotice]=useState(''),[view,setView]=useState('pets'),[query,setQuery]=useState('')
  const closeRef=useRef(null)
  const {user,logout}=useAuth(),router=useRouter()
  const load=()=>fetch('/api/applications').then(r=>r.ok?r.json():Promise.reject()).then(d=>setApplications(d.applications||[])).catch(()=>router.replace('/login'))
  useEffect(()=>{load()},[])
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const key=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',key);setTimeout(()=>closeRef.current?.focus(),0);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key)}},[open])
  const cancel=async()=>{const r=await fetch('/api/applications/'+confirm.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cancel',version:confirm.version})});const d=await r.json();if(r.ok){setNotice(`Your adoption request for ${confirm.petName} was cancelled.`);setConfirm(null);load()}else setNotice(d.error)}
  const show=(pet,shouldApply=false)=>{setDetail(pet);setApply(shouldApply)}
  const visiblePets=pets.filter(p=>`${p.name} ${p.type} ${p.breed}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="min-h-screen overflow-x-hidden bg-mist md:grid md:grid-cols-[280px_1fr]">
    {open&&<button className="dashboard-overlay md:hidden" onClick={()=>setOpen(false)} aria-label="Close user navigation"/>}
    <aside className={`dashboard-sidebar ${open?'translate-x-0':'-translate-x-full'} md:translate-x-0`} aria-label="User navigation"><div className="flex items-center justify-between"><BrandLogo/><button ref={closeRef} onClick={()=>setOpen(false)} className="grid h-11 w-11 place-items-center md:hidden" aria-label="Close user navigation"><X/></button></div><nav className="mt-10 space-y-2">{links.map(([Icon,id,label])=><button key={id} className={`sidebar-link ${view===id?'active':''}`} aria-current={view===id?'page':undefined} onClick={()=>{setView(id);setNotice('');setOpen(false)}}><Icon size={20}/>{label}</button>)}</nav><div className="mt-auto border-t border-brown/30 pt-5"><div className="flex items-center gap-3"><span className="avatar">{user?.name?.[0]||'A'}</span><div className="min-w-0"><b className="block truncate">{user?.name||'Adopter'}</b><p className="text-xs text-warm">Adopter</p></div><button onClick={async()=>{await logout();router.push('/')}} className="ml-auto grid h-11 w-11 place-items-center" aria-label="Log out"><LogOut size={18}/></button></div></div></aside>
    <main className="min-w-0"><header className="flex min-h-20 items-center gap-2 px-4 sm:gap-4 md:h-24 md:px-10"><button className="grid h-11 w-11 shrink-0 place-items-center md:hidden" onClick={()=>setOpen(true)} aria-label="Open user navigation" aria-expanded={open}><Menu/></button>{view==='pets'?<label className="search-box min-w-0 flex-1"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search adoptable pets" aria-label="Search adoptable pets"/></label>:<div className="flex-1"/>}<button className="icon-btn shrink-0" aria-label="Notifications"><Bell/></button><Link href="/donate" className="btn-primary hidden shrink-0 sm:inline-flex">Donate <Heart size={16} className="fill-white"/></Link></header>
      <div className="px-4 pb-12 sm:px-5 md:px-10"><section className="rounded-[2rem] bg-white p-6 sm:p-8 md:max-w-xl"><p className="eyebrow">Welcome, {user?.name||'Adopter'}!</p><h1 className="font-display text-2xl font-bold sm:text-3xl">{view==='applications'?'Track your adoption journey.':view==='messages'?'Stay connected with Whelps.':view==='settings'?'Manage your account.':'Ready to find your new best friend?'}</h1></section>{notice&&<p className="mt-5 rounded-xl bg-orange/10 p-4 font-bold text-brown">{notice}</p>}
        {view==='pets'&&<PetsView pets={visiblePets} show={show} clearSearch={()=>setQuery('')}/>}
        {view==='applications'&&<ApplicationsView applications={applications} openMessages={()=>setView('messages')} setConfirm={setConfirm}/>}
        {view==='messages'&&<section className="mt-8"><h2 className="section-title mb-5">Messages</h2><MessagingPanel compact/></section>}
        {view==='settings'&&<UserSettings/>}
      </div>
    </main>
    {detail&&<PetDetailModal key={`${detail.id}-${apply}`} pet={detail} initialApply={apply} onClose={()=>{setDetail(null);setApply(false)}}/>}
    {confirm&&<div className="modal-backdrop"><div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-7" role="alertdialog" aria-modal="true" aria-labelledby="cancel-title"><h2 id="cancel-title" className="font-display text-3xl font-black">Cancel this application?</h2><p className="mt-3 text-warm">This will close your active request for {confirm.petName}. Its history will be preserved, and you may apply for another pet afterward.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={()=>setConfirm(null)} className="btn-secondary min-h-11">Keep Application</button><button onClick={cancel} className="min-h-11 rounded-full bg-red-700 px-5 py-3 font-bold text-white">Yes, Cancel</button></div></div></div>}
  </div>
}

function PetsView({pets:visiblePets,show,clearSearch}){return <section className="mt-8 sm:mt-10"><div className="flex items-end justify-between"><div><p className="eyebrow">Your dashboard</p><h2 className="section-title">Adoptable Pets</h2></div><Link href="/home" className="btn-secondary hidden sm:inline-flex">Browse all</Link></div>{visiblePets.length?<div className="mt-7 grid gap-7 sm:grid-cols-2 xl:grid-cols-3">{visiblePets.map(p=><PetCard key={p.id} pet={p} compact onDetails={show}/>)}</div>:<div className="mt-7 rounded-3xl bg-white p-8 text-center text-warm"><p>No pets match your search.</p><button onClick={clearSearch} className="btn-secondary mt-4">Clear search</button></div>}</section>}

function ApplicationsView({applications,openMessages,setConfirm}){return <section className="mt-8 sm:mt-10"><p className="eyebrow">Application updates</p><h2 className="section-title">Your Applications</h2><div className="mt-6 grid gap-4 lg:grid-cols-2">{applications.map(app=><article key={app.id} className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm min-[420px]:flex-row sm:p-5"><SiteImage src={app.petImage} alt={app.petName} className="h-44 w-full shrink-0 rounded-2xl min-[420px]:h-24 min-[420px]:w-24" sizes="(max-width: 419px) 100vw, 96px"/><div className="min-w-0 flex-1"><h3 className="font-display text-2xl font-bold">{app.petName}</h3><span className="status-pill mt-1 whitespace-normal">{app.status}</span><p className="mt-2 break-words text-sm text-warm">{app.latestUpdate}</p><p className="mt-1 text-xs text-warm">Updated {new Date(app.updatedAt).toLocaleString()}</p><div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">{app.conversationId&&<button onClick={openMessages} className="btn-secondary min-h-11 !px-3 !py-2 text-xs">Open Messages</button>}{cancellable.includes(app.status)&&<button onClick={()=>setConfirm(app)} className="min-h-11 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Cancel Application</button>}</div></div></article>)}{!applications.length&&<div className="rounded-3xl bg-white p-8 text-center text-warm lg:col-span-2">You have not submitted an adoption application yet.<Link href="/home" className="btn-primary mx-auto mt-5 w-fit">Browse Pets</Link></div>}</div></section>}
