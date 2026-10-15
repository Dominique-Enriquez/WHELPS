import { Bell, ChevronDown, Heart, Menu, PawPrint, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import BrandLogo from './BrandLogo'
import { useAuth } from '../context/AuthContext'

const links = [['/', 'Home'], ['/our-story', 'Our Story'], ['/success-stories', 'Success Stories'], ['/donate', 'Donate']]

export default function Navbar({ overlay = false }) {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState(false)
  const [notice, setNotice] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const key=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key)}},[open])
  const navClass = overlay ? 'absolute top-0 left-0 z-30 w-full text-white' : 'relative bg-cream text-ink border-b border-brown/15'
  return (
    <header className={navClass}>
      <div className="site-container flex h-20 items-center justify-between gap-3 sm:gap-6">
        <BrandLogo className="max-w-[145px] sm:max-w-none"/>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {links.map(([to, label]) => <Link key={to} href={to} className={`nav-link ${router.pathname === to ? 'is-active' : ''}`}>{label}{label === 'Donate' && <Heart className="inline ml-1 fill-red-500 text-red-500" size={12}/>}</Link>)}
          {user && <Link href="/how-it-works" className={`nav-link ${router.pathname === '/how-it-works' ? 'is-active' : ''}`}>How It Works</Link>}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? <>
            <button className="icon-btn relative" onClick={() => setNotice(!notice)} aria-label="Notifications"><Bell size={21}/><i /></button>
            {notice && <div className="popover top-16 right-44"><p className="font-bold">Notifications</p><p className="text-sm text-warm mt-2">Your saved pets are waiting for you.</p></div>}
            <div className="relative">
              <button onClick={() => setProfile(!profile)} className="flex items-center gap-2 font-bold capitalize"><span className="avatar">{user.name[0]}</span>{user.name}<ChevronDown size={16}/></button>
              {profile && <div className="popover right-0 top-11"><Link href={user.role==='ADMIN'?'/admin/dashboard':'/dashboard'}>Dashboard</Link><button onClick={async() => { await logout(); router.push('/') }}>Log out</button></div>}
            </div>
          </> : <Link href="/login" className="btn-primary text-sm">Login to Adopt <PawPrint size={15}/></Link>}
        </div>
        <button className="grid h-11 w-11 shrink-0 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label={open?'Close menu':'Open menu'} aria-expanded={open}>{open ? <X/> : <Menu/>}</button>
      </div>
      {open&&<button onClick={()=>setOpen(false)} className="fixed inset-0 top-20 z-40 bg-black/40 md:hidden" aria-label="Close menu"/>}{open && <div className="mobile-nav md:hidden" role="dialog" aria-label="Main navigation">{links.map(([to,label]) => <Link onClick={() => setOpen(false)} key={to} href={to}>{label}</Link>)}<Link onClick={()=>setOpen(false)} href={user ? (user.role==='ADMIN'?'/admin/dashboard':'/dashboard') : '/login'}>{user ? 'Dashboard' : 'Login to Adopt'}</Link></div>}
    </header>
  )
}
