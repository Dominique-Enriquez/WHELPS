import { ClipboardList, HeartHandshake, MessageSquare, PawPrint, RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AdminShell from '../components/AdminShell'

const empty={applications:[],statistics:{}}

export default function AdminDashboard({initialData=null,initialError=''}){
  const [data,setData]=useState<any>(initialData||empty),[loading,setLoading]=useState(!initialData),[error,setError]=useState(initialError),[updatedAt,setUpdatedAt]=useState(initialData?new Date():null)
  const load=useCallback(async({silent=false}={})=>{
    if(!silent)setLoading(true)
    setError('')
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000)
    try{
      const response=await fetch('/api/admin/applications',{cache:'no-store',signal:controller.signal})
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body.error||'Dashboard data could not be loaded.')
      setData({applications:Array.isArray(body.applications)?body.applications:[],statistics:body.statistics||{}})
      setUpdatedAt(new Date())
    }catch(err){setError(err.name==='AbortError'?'The live refresh timed out. The last confirmed statistics are still shown.':err.message)}finally{clearTimeout(timeout);setLoading(false)}
  },[])
  useEffect(()=>{
    if(!initialData)load()
    const interval=setInterval(()=>load({silent:true}),10000)
    const refresh=()=>load({silent:true})
    window.addEventListener('focus',refresh)
    return()=>{clearInterval(interval);window.removeEventListener('focus',refresh)}
  },[initialData,load])
  const s=data.statistics
  const cards: any[]=[[Users,'Adopter Accounts',s.users],[PawPrint,'Available Pets',s.availablePets],[ClipboardList,'Applications',s.total],[HeartHandshake,'Completed Adoptions',s.completed],[MessageSquare,'Unread Messages',s.unreadMessages]]
  return <AdminShell title="Dashboard" subtitle="Operational overview for Whelps Animal Care & Rehabilitation Center.">
    <p className="mb-3 text-right text-xs text-warm">{updatedAt?`Live data · Updated ${updatedAt.toLocaleTimeString()}`:'Connecting to PostgreSQL…'}</p>
    {error&&<div className="mb-5 flex flex-col gap-3 rounded-2xl bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between"><p><strong>Database data could not be loaded.</strong> {error}</p><button onClick={()=>load()} className="btn-secondary shrink-0"><RefreshCw size={16}/> Retry</button></div>}
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-5">{cards.map(([Icon,label,value])=><article key={label} className="min-w-0 rounded-2xl border border-brown/10 bg-white p-4 shadow-sm sm:p-5"><Icon className="text-orange"/><p className="mt-3 text-3xl font-black sm:mt-4">{loading?'—':value??0}</p><p className="break-words text-sm text-warm">{label}</p></article>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]"><section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-black sm:text-3xl">Recent Applications</h2><Link href="/admin/applications" className="min-h-11 py-3 font-bold text-orange">Review all</Link></div><div className="mt-4 divide-y divide-brown/10">{loading?<p className="py-8 text-center text-warm">Loading database records…</p>:data.applications.slice(0,6).map(a=><Link href="/admin/applications" key={a.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 py-4 min-[430px]:grid-cols-[2.5rem_minmax(0,1fr)_auto]"><span className="avatar">{a.fullName?.[0]||'A'}</span><span className="min-w-0"><b className="block truncate">{a.fullName}</b><small className="block truncate text-warm">{a.petName}</small></span><span className="status-pill col-start-2 whitespace-normal min-[430px]:col-start-auto">{a.status}</span></Link>)}{!loading&&!data.applications.length&&!error&&<p className="py-8 text-center text-warm">No applications yet.</p>}</div></section><section className="rounded-2xl bg-cream p-4 sm:p-6"><h2 className="font-display text-2xl font-black sm:text-3xl">Needs Attention</h2><dl className="mt-5 space-y-4"><Metric loading={loading} label="Submitted applications" value={s.submitted}/><Metric loading={loading} label="Under review" value={s.underReview}/><Metric loading={loading} label="Health verifications" value={s.healthPending}/><Metric loading={loading} label="Monitoring updates" value={s.pendingMonitoring}/></dl></section></div>
  </AdminShell>
}

function Metric({label,value,loading}){return <div className="flex items-center justify-between rounded-xl bg-white p-4"><dt className="font-bold">{label}</dt><dd className="rounded-full bg-orange px-3 py-1 font-black text-white">{loading?'—':value??0}</dd></div>}
