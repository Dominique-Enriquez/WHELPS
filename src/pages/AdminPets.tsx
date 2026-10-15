import { Plus, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminShell from '../components/AdminShell'
import SiteImage from '../components/SiteImage'

const emptyListing={name:'',type:'Dog',breed:'',age:'',gender:'Male',fixedStatus:'Neutered',vaccinationStatus:'Vaccinated',healthNotes:'',healthVerification:'Pending Verification',description:'',image:'/images/pets/max.webp'}
const petImages=[['/images/pets/max.webp','Golden dog'],['/images/pets/rocky.webp','Brown and white dog'],['/images/pets/buddy.webp','Small white and brown dog'],['/images/pets/luna.webp','Light-colored cat'],['/images/pets/felix.webp','Orange tabby cat'],['/images/pets/bella.webp','Black and white cat']]

export default function AdminPets({ adopted = false }) {
  const [pets, setPets] = useState([])
  const [records, setRecords] = useState([])
  const [placements, setPlacements] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [showForm,setShowForm]=useState(false),[listing,setListing]=useState(emptyListing),[saving,setSaving]=useState(false),[photoError,setPhotoError]=useState('')
  const firstField=useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const [petResponse, monitoringResponse] = await Promise.all([
        fetch('/api/admin/pets', { cache: 'no-store' }),
        adopted ? fetch('/api/monitoring', { cache: 'no-store' }) : Promise.resolve(null),
      ])
      const petData = await petResponse.json().catch(() => ({}))
      if (!petResponse.ok) throw new Error(petData.error || 'Pet records could not be loaded.')
      setPets((petData.pets || []).filter(pet => adopted ? pet.availability === 'Adopted' : pet.availability !== 'Adopted'))
      if (adopted) {
        const monitoringData = await monitoringResponse.json().catch(() => ({}))
        if (!monitoringResponse.ok) throw new Error(monitoringData.error || 'Monitoring records could not be loaded.')
        setRecords(monitoringData.records || [])
        setPlacements(monitoringData.placements || [])
      }
    } catch (loadError) {
      setError(loadError.message)
    }
  }, [adopted])

  useEffect(() => {
    load()
    if (!adopted) return
    const interval = setInterval(load, 10000)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', load)
    }
  }, [adopted, load])

  useEffect(()=>{if(!showForm)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const onKey=(event: KeyboardEvent)=>{if(event.key==='Escape')setShowForm(false)};document.addEventListener('keydown',onKey);setTimeout(()=>firstField.current?.focus(),0);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',onKey)}},[showForm])

  const filtered = useMemo(() => pets.filter(pet => `${pet.name} ${pet.breed} ${pet.availability}`.toLowerCase().includes(query.toLowerCase())), [pets, query])

  const update=(field,value)=>setListing(current=>({...current,[field]:value}))
  const choosePhoto=event=>{const file=event.target.files?.[0];if(!file)return;setPhotoError('');if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setPhotoError('Choose a JPG, PNG, or WebP image.');event.target.value='';return}if(file.size>2*1024*1024){setPhotoError('Choose an image no larger than 2 MB.');event.target.value='';return}const reader=new FileReader();reader.onload=()=>update('image',String(reader.result));reader.onerror=()=>setPhotoError('The photo could not be read. Try another image.');reader.readAsDataURL(file)}

  const createListing=async event=>{event.preventDefault();setSaving(true);setError('');try{const response=await fetch('/api/admin/pets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(listing)});const data=await response.json().catch(()=>({}));if(!response.ok){setError(data.error||'The pet listing could not be created.');return}setListing(emptyListing);setShowForm(false);await load()}catch{setError('The pet listing could not be created. Try again.')}finally{setSaving(false)}}

  const save = async (pet, changes) => {
    setError('')
    const response = await fetch('/api/admin/pets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pet.id, name: pet.name, breed: pet.breed, age: pet.age, gender: pet.gender, fixedStatus: pet.fixedStatus || pet.fixed_status, vaccinationStatus: pet.vaccinationStatus || pet.vaccination_status, healthNotes: pet.healthNotes || pet.health_notes, healthVerification: pet.healthVerification || pet.health_verification, description: pet.description, availability: pet.availability, published: Boolean(pet.published), ...changes }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) setError(data.error || 'The pet could not be updated.')
    else load()
  }

  const updateMonitoring = async (record, body) => {
    setError('')
    const response = await fetch('/api/monitoring', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: record.id, ...body }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) setError(data.error || 'The monitoring record could not be updated.')
    else load()
  }

  const complete = record => {
    if (confirm(`Complete the adoption of ${record.petName}? This ends the monitoring stage and marks the pet as adopted.`)) updateMonitoring(record, { action: 'complete' })
  }

  const actions=!adopted?<button onClick={()=>{setError('');setPhotoError('');setShowForm(true)}} className="btn-primary w-full sm:w-auto"><Plus size={19}/>Add Pet Listing</button>:null

  return <AdminShell title={adopted ? 'Monitoring & Adopted Pets' : 'Pet & Health Records'} subtitle={adopted ? 'Monitor approved placements, review adopter updates, and finalize adoptions only when monitoring is complete.' : 'Verify health information before publishing adoptable pet profiles.'} actions={actions}>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 font-bold text-red-700">{error}</p>}
    {!adopted && <p className="mb-5 rounded-xl bg-orange/10 p-4 text-sm text-brown">Add a JPG, PNG, or WebP photo to each new listing, or select one of the existing site images.</p>}
    {adopted && <section className="mb-8"><h2 className="font-display text-3xl font-black">Active Monitoring</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{placements.map(placement => <article key={placement.id} className="flex items-center gap-4 rounded-2xl border border-brown/10 bg-white p-4"><SiteImage src={placement.petImage} alt={placement.petName} className="h-20 w-20 rounded-xl" sizes="80px" /><div><h3 className="font-black">{placement.petName}</h3><p className="text-sm text-warm">Adopter: {placement.adopterName}</p><span className="status-pill mt-2">Approved · Monitoring</span></div></article>)}{!placements.length && <p className="rounded-2xl bg-white p-8 text-center text-warm md:col-span-2">No approved placements are currently being monitored.</p>}</div></section>}
    <label className="search-box mb-5 max-w-lg border border-brown/10"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search pet name, breed, or status…" /></label>
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{filtered.map(pet => <article key={pet.id} className="flex flex-col gap-4 rounded-2xl border border-brown/10 bg-white p-4 min-[430px]:flex-row"><SiteImage src={pet.image} alt={pet.name} className="h-48 w-full shrink-0 rounded-2xl min-[430px]:h-32 min-[430px]:w-32" sizes="(max-width: 429px) 100vw, 128px" /><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><h2 className="truncate font-display text-2xl font-black">{pet.name}</h2><p className="text-sm text-warm">{pet.breed} · {pet.age}</p></div><span className="status-pill">{pet.availability}</span></div><p className="mt-2 text-sm">{pet.vaccinationStatus || pet.vaccination_status} · {pet.fixedStatus || pet.fixed_status}</p><label className="mt-3 block text-xs">Health verification<select value={pet.healthVerification || pet.health_verification} disabled={adopted} onChange={event => save(pet, { healthVerification: event.target.value, published: event.target.value === 'Verified' && Boolean(pet.published) })}><option>Pending Verification</option><option>Requires Update</option><option>Verified</option></select></label>{!adopted && <button onClick={() => save(pet, { published: !pet.published })} disabled={(pet.healthVerification || pet.health_verification) !== 'Verified'} className="btn-secondary mt-3 min-h-11 w-full !px-4 !py-2 text-sm sm:w-auto">{pet.published ? 'Unpublish' : 'Publish'}</button>}</div></article>)}{!filtered.length && <p className="rounded-2xl bg-white p-10 text-center text-warm md:col-span-2">{adopted ? 'No finalized adoptions yet.' : 'No records in this view.'}</p>}</div>
    {adopted && <section className="mt-8"><h2 className="font-display text-3xl font-black">Monitoring Updates</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{records.map(record => <article key={record.id} className="rounded-2xl border border-brown/10 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black">{record.petName} · {record.adopterName}</h3><p className="text-xs text-warm">Submitted {new Date(record.submittedAt).toLocaleString()}</p></div><span className="status-pill">{record.reviewStatus}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-bold text-warm">Pet condition</dt><dd className="break-words">{record.petCondition}</dd></div><div><dt className="font-bold text-warm">Feeding</dt><dd className="break-words">{record.feedingUpdate || 'Not provided'}</dd></div><div><dt className="font-bold text-warm">Health</dt><dd className="break-words">{record.healthObservations || 'Not provided'}</dd></div><div><dt className="font-bold text-warm">Behavior</dt><dd className="break-words">{record.behaviorUpdate || 'Not provided'}</dd></div></dl><div className="mt-4 grid gap-2 sm:flex">{record.placementStatus === 'Monitoring' && record.reviewStatus !== 'Reviewed' && <button onClick={() => updateMonitoring(record, { action: 'review', reviewStatus: 'Reviewed' })} className="rounded-full bg-green-700 px-4 py-3 font-bold text-white">Mark Reviewed</button>}{record.placementStatus === 'Monitoring' && <button onClick={() => updateMonitoring(record, { action: 'review', reviewStatus: 'Needs Clarification' })} className="btn-secondary">Needs Clarification</button>}{record.placementStatus === 'Monitoring' && record.reviewStatus === 'Reviewed' && <button onClick={() => complete(record)} className="rounded-full bg-green-700 px-4 py-3 font-bold text-white">Complete Adoption</button>}</div></article>)}{!records.length && <p className="rounded-2xl bg-white p-8 text-center text-warm">No monitoring updates have been submitted.</p>}</div></section>}
    {showForm&&<ListingDialog listing={listing} update={update} saving={saving} submit={createListing} close={()=>setShowForm(false)} firstField={firstField} error={error} photoError={photoError} choosePhoto={choosePhoto}/>}
  </AdminShell>
}

function ListingDialog({listing,update,saving,submit,close,firstField,error,photoError,choosePhoto}){
  const existingImage=petImages.some(([src])=>src===listing.image)
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:items-center" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section role="dialog" aria-modal="true" aria-labelledby="add-pet-title" className="my-4 w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Available Pets</p><h2 id="add-pet-title" className="font-display text-3xl font-black">Add Pet Listing</h2><p className="mt-1 text-sm text-warm">Create the profile now, then verify its health record before publishing.</p></div><button type="button" onClick={close} className="icon-btn shrink-0" aria-label="Close add pet listing form"><X/></button></div>{error&&<p className="mt-5 rounded-xl bg-red-50 p-3 font-bold text-red-700" role="alert">{error}</p>}<form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><label>Pet name<input ref={firstField} required value={listing.name} onChange={event=>update('name',event.target.value)} placeholder="e.g. Milo"/></label><label>Animal type<select value={listing.type} onChange={event=>update('type',event.target.value)}><option>Dog</option><option>Cat</option></select></label><label>Breed<input required value={listing.breed} onChange={event=>update('breed',event.target.value)} placeholder="e.g. Aspin"/></label><label>Age<input required value={listing.age} onChange={event=>update('age',event.target.value)} placeholder="e.g. 2 years old"/></label><label>Gender<select value={listing.gender} onChange={event=>update('gender',event.target.value)}><option>Male</option><option>Female</option></select></label><label>Spay / neuter status<select value={listing.fixedStatus} onChange={event=>update('fixedStatus',event.target.value)}><option>Neutered</option><option>Spayed</option><option>Not yet fixed</option></select></label><label>Vaccination status<select value={listing.vaccinationStatus} onChange={event=>update('vaccinationStatus',event.target.value)}><option>Vaccinated</option><option>Partially Vaccinated</option><option>Not Vaccinated</option></select></label><label>Health verification<select value={listing.healthVerification} onChange={event=>update('healthVerification',event.target.value)}><option>Pending Verification</option><option>Requires Update</option><option>Verified</option></select></label><fieldset className="rounded-2xl border border-brown/10 p-4 sm:col-span-2"><legend className="px-2 font-bold">Pet photo</legend><div className="grid items-center gap-4 sm:grid-cols-[9rem_1fr]"><SiteImage src={listing.image} alt="Pet listing preview" className="aspect-square w-full rounded-2xl" sizes="144px"/><div><label className="block">Upload a photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto}/></label><p className="mt-2 text-xs text-warm">JPG, PNG, or WebP · maximum 2 MB</p>{photoError&&<p className="mt-2 text-sm font-bold text-red-700" role="alert">{photoError}</p>}<label className="mt-4 block">Or use an existing image<select value={existingImage?listing.image:''} onChange={event=>update('image',event.target.value)}><option value="" disabled>{existingImage?'Choose an image':'Uploaded photo selected'}</option>{petImages.map(([src,label])=><option key={src} value={src}>{label}</option>)}</select></label></div></div></fieldset><label className="sm:col-span-2">Health notes<textarea rows={3} value={listing.healthNotes} onChange={event=>update('healthNotes',event.target.value)} placeholder="Optional notes about treatment, medication, or follow-up care"/></label><label className="sm:col-span-2">Pet description<textarea required rows={4} value={listing.description} onChange={event=>update('description',event.target.value)} placeholder="Describe the pet’s temperament, story, and ideal home"/></label><div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary disabled:opacity-60">{saving?'Creating Listing…':'Create Pet Listing'}</button></div></form></section></div>
}
