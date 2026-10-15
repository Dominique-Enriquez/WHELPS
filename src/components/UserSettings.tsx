import { Lock, Mail, MapPin, Phone, Save, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { places } from '../data/places'

export default function UserSettings(){
  const {user,refreshUser}=useAuth()
  const [form,setForm]=useState({name:'',email:'',phone:'',region:'',city:'',currentPassword:'',newPassword:''})
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('')
  useEffect(()=>{if(user)setForm(current=>({...current,name:user.name||'',email:user.email||'',phone:user.phone||'',region:user.region||'',city:user.city||''}))},[user])
  const update=e=>setForm(current=>({...current,[e.target.name]:e.target.value,...(e.target.name==='region'?{city:''}:{})}))
  const submit=async e=>{
    e.preventDefault();setBusy(true);setMessage('');setError('')
    try{
      const response=await fetch('/api/auth/me',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
      const data=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(data.error||'Your settings could not be saved.')
      await refreshUser()
      setForm(current=>({...current,currentPassword:'',newPassword:''}))
      setMessage(data.message||'Settings saved.')
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  const cities=places[form.region]||[]
  return <section className="mt-8 max-w-3xl rounded-3xl bg-white p-5 shadow-sm sm:p-8"><p className="eyebrow">Account settings</p><h2 className="section-title">Your Profile</h2><p className="mt-2 text-sm text-warm">Keep your contact details current so Whelps can reach you about an application.</p><form onSubmit={submit} className="mt-7 grid gap-4 md:grid-cols-2"><label className="md:col-span-2">Full Name<div className="input-icon"><User/><input name="name" value={form.name} onChange={update} required autoComplete="name"/></div></label><label className="md:col-span-2">Email Address<div className="input-icon"><Mail/><input name="email" type="email" value={form.email} onChange={update} required autoComplete="email"/></div></label><label className="md:col-span-2">Contact Number<div className="input-icon"><Phone/><input name="phone" type="tel" value={form.phone} onChange={update} required autoComplete="tel"/></div></label><label>Province or Region<div className="input-icon"><MapPin/><select name="region" value={form.region} onChange={update} required><option value="">Select a region</option>{Object.keys(places).map(region=><option key={region}>{region}</option>)}</select></div></label><label>City<select name="city" value={form.city} onChange={update} required disabled={!form.region}><option value="">Select a city</option>{cities.map(city=><option key={city}>{city}</option>)}</select></label><div className="md:col-span-2 mt-3 border-t border-brown/10 pt-6"><h3 className="flex items-center gap-2 font-display text-2xl font-bold"><Lock size={21}/>Change Password</h3><p className="mt-1 text-xs text-warm">Leave both password fields blank to keep your current password.</p></div><label>Current Password<input name="currentPassword" type="password" value={form.currentPassword} onChange={update} autoComplete="current-password"/></label><label>New Password<input name="newPassword" type="password" minLength={12} value={form.newPassword} onChange={update} placeholder="At least 12 characters" autoComplete="new-password"/></label>{error&&<p className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}{message&&<p className="md:col-span-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800" role="status">{message}</p>}<button disabled={busy} className="btn-primary md:col-span-2 md:w-fit disabled:opacity-60"><Save size={17}/>{busy?'Saving…':'Save Settings'}</button></form></section>
}
