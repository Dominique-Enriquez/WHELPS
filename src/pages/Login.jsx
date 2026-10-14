import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ImagePlaceholder from '../components/ImagePlaceholder'
import { useAuth } from '../context/AuthContext'

export default function Login(){
  const [show,setShow]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const {login}=useAuth(),router=useRouter()
  const submit=async e=>{e.preventDefault();setError('');setBusy(true);const fd=new FormData(e.currentTarget);try{const user=await login(fd.get('email'),fd.get('password'));router.replace(user.role==='ADMIN'?'/admin/dashboard':'/home')}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <><div className="auth-page"><ImagePlaceholder className="absolute inset-0 h-full w-full opacity-35" rounded="rounded-none"/><div className="absolute inset-0 bg-brown/65"/><Navbar overlay/><main className="relative z-10 flex min-h-[900px] items-center justify-center px-5 pb-16 pt-28"><div className="auth-card"><h1 className="section-title">Welcome Back!</h1><p className="mt-2 text-lg font-bold text-warm">Continue your journey toward meeting the right pet.</p><div className="auth-tabs"><span className="active">Sign In</span><Link href="/register">Register</Link></div><form onSubmit={submit} className="mt-8"><h2 className="font-display text-3xl font-bold">Sign in to continue</h2><p className="mt-2 text-warm">Access your saved pets, applications, messages, and updates.</p><label className="mt-7 block">Email Address<div className="input-icon"><Mail/><input name="email" type="email" placeholder="you@email.com" required autoComplete="email"/></div></label><label className="mt-4 block">Password<div className="input-icon"><Lock/><input name="password" type={show?'text':'password'} placeholder="••••••••••••" required autoComplete="current-password"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff/>:<Eye/>}</button></div></label>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}<button disabled={busy} className="btn-primary mt-6 w-full disabled:opacity-60">{busy?'Signing in…':'Sign In →'}</button></form><p className="mt-5 text-center text-sm">Don’t have an account? <Link className="font-bold text-orange" href="/register">Register</Link></p><p className="mt-2 text-center text-xs text-warm">Administrator accounts are provisioned privately by the site operator.</p></div></main></div><Footer/></>
}
