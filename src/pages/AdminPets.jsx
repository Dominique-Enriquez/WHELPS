import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminShell from '../components/AdminShell'
import SiteImage from '../components/SiteImage'

export default function AdminPets({ adopted = false }) {
  const [pets, setPets] = useState([])
  const [records, setRecords] = useState([])
  const [placements, setPlacements] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const petResponse = await fetch('/api/admin/pets', { cache: 'no-store' })
      const petData = await petResponse.json().catch(() => ({}))
      if (!petResponse.ok) throw new Error(petData.error || 'Pet records could not be loaded.')
      setPets((petData.pets || []).filter(pet => adopted ? pet.availability === 'Adopted' : pet.availability !== 'Adopted'))
      if (adopted) {
        const monitoringResponse = await fetch('/api/monitoring', { cache: 'no-store' })
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

  const filtered = useMemo(() => pets.filter(pet => `${pet.name} ${pet.breed} ${pet.availability}`.toLowerCase().includes(query.toLowerCase())), [pets, query])

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

  return <AdminShell title={adopted ? 'Monitoring & Adopted Pets' : 'Pet & Health Records'} subtitle={adopted ? 'Monitor approved placements, review adopter updates, and finalize adoptions only when monitoring is complete.' : 'Verify health information before publishing adoptable pet profiles.'}>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 font-bold text-red-700">{error}</p>}
    {!adopted && <p className="mb-5 rounded-xl bg-orange/10 p-4 text-sm text-brown">Pet images currently use existing site assets. New image upload requires private object storage, which is not configured.</p>}
    {adopted && <section className="mb-8"><h2 className="font-display text-3xl font-black">Active Monitoring</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{placements.map(placement => <article key={placement.id} className="flex items-center gap-4 rounded-2xl border border-brown/10 bg-white p-4"><SiteImage src={placement.petImage} alt={placement.petName} className="h-20 w-20 rounded-xl" sizes="80px" /><div><h3 className="font-black">{placement.petName}</h3><p className="text-sm text-warm">Adopter: {placement.adopterName}</p><span className="status-pill mt-2">Approved · Monitoring</span></div></article>)}{!placements.length && <p className="rounded-2xl bg-white p-8 text-center text-warm md:col-span-2">No approved placements are currently being monitored.</p>}</div></section>}
    <label className="search-box mb-5 max-w-lg border border-brown/10"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search pet name, breed, or status…" /></label>
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{filtered.map(pet => <article key={pet.id} className="flex flex-col gap-4 rounded-2xl border border-brown/10 bg-white p-4 min-[430px]:flex-row"><SiteImage src={pet.image} alt={pet.name} className="h-48 w-full shrink-0 rounded-2xl min-[430px]:h-32 min-[430px]:w-32" sizes="(max-width: 429px) 100vw, 128px" /><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><h2 className="truncate font-display text-2xl font-black">{pet.name}</h2><p className="text-sm text-warm">{pet.breed} · {pet.age}</p></div><span className="status-pill">{pet.availability}</span></div><p className="mt-2 text-sm">{pet.vaccinationStatus || pet.vaccination_status} · {pet.fixedStatus || pet.fixed_status}</p><label className="mt-3 block text-xs">Health verification<select value={pet.healthVerification || pet.health_verification} disabled={adopted} onChange={event => save(pet, { healthVerification: event.target.value, published: event.target.value === 'Verified' && Boolean(pet.published) })}><option>Pending Verification</option><option>Requires Update</option><option>Verified</option></select></label>{!adopted && <button onClick={() => save(pet, { published: !pet.published })} disabled={(pet.healthVerification || pet.health_verification) !== 'Verified'} className="btn-secondary mt-3 min-h-11 w-full !px-4 !py-2 text-sm sm:w-auto">{pet.published ? 'Unpublish' : 'Publish'}</button>}</div></article>)}{!filtered.length && <p className="rounded-2xl bg-white p-10 text-center text-warm md:col-span-2">{adopted ? 'No finalized adoptions yet.' : 'No records in this view.'}</p>}</div>
    {adopted && <section className="mt-8"><h2 className="font-display text-3xl font-black">Monitoring Updates</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{records.map(record => <article key={record.id} className="rounded-2xl border border-brown/10 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black">{record.petName} · {record.adopterName}</h3><p className="text-xs text-warm">Submitted {new Date(record.submittedAt).toLocaleString()}</p></div><span className="status-pill">{record.reviewStatus}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-bold text-warm">Pet condition</dt><dd className="break-words">{record.petCondition}</dd></div><div><dt className="font-bold text-warm">Feeding</dt><dd className="break-words">{record.feedingUpdate || 'Not provided'}</dd></div><div><dt className="font-bold text-warm">Health</dt><dd className="break-words">{record.healthObservations || 'Not provided'}</dd></div><div><dt className="font-bold text-warm">Behavior</dt><dd className="break-words">{record.behaviorUpdate || 'Not provided'}</dd></div></dl><div className="mt-4 grid gap-2 sm:flex">{record.placementStatus === 'Monitoring' && record.reviewStatus !== 'Reviewed' && <button onClick={() => updateMonitoring(record, { action: 'review', reviewStatus: 'Reviewed' })} className="rounded-full bg-green-700 px-4 py-3 font-bold text-white">Mark Reviewed</button>}{record.placementStatus === 'Monitoring' && <button onClick={() => updateMonitoring(record, { action: 'review', reviewStatus: 'Needs Clarification' })} className="btn-secondary">Needs Clarification</button>}{record.placementStatus === 'Monitoring' && record.reviewStatus === 'Reviewed' && <button onClick={() => complete(record)} className="rounded-full bg-green-700 px-4 py-3 font-bold text-white">Complete Adoption</button>}</div></article>)}{!records.length && <p className="rounded-2xl bg-white p-8 text-center text-warm">No monitoring updates have been submitted.</p>}</div></section>}
  </AdminShell>
}
