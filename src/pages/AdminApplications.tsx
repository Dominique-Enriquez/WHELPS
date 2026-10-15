import { ArrowLeft, Check, ChevronRight, Clock3, Search, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AdminShell from '../components/AdminShell'
import SiteImage from '../components/SiteImage'

const evaluationOptions = ['', 'Suitable', 'Needs Clarification', 'Concern Identified']
const approvedStatus = 'Approved — Awaiting Placement'
const finalStatuses = ['Rejected', 'Cancelled by Applicant', 'Adoption Completed']
const prettyDate = value => value ? new Date(value).toLocaleString() : '—'

export default function AdminApplications() {
  const [data, setData] = useState<any>({ applications: [], statistics: {} })
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All Applications')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const params = new URLSearchParams({ search, status })
      const response = await fetch('/api/admin/applications?' + params, { cache: 'no-store', signal: controller.signal })
      const next = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(next.error || 'Applications could not be loaded.')
      setData(next)
      setSelected(current => next.applications.find(item => item.id === current?.id) || (typeof window !== 'undefined' && window.innerWidth >= 1280 ? next.applications[0] : null) || null)
      setError('')
    } catch (loadError) {
      setError(loadError.name === 'AbortError' ? 'The live refresh timed out. Please try again.' : loadError.message)
    } finally {
      clearTimeout(timeout)
    }
  }, [search, status])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', load)
    }
  }, [load])

  const act = async (action, extra = {}) => {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/applications/' + selected.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          version: selected.version,
          housingEvaluation: selected.housingEvaluation,
          financialEvaluation: selected.financialEvaluation,
          experienceEvaluation: selected.experienceEvaluation,
          readinessEvaluation: selected.readinessEvaluation,
          internalNotes: selected.internalNotes,
          ...extra,
        }),
      })
      const next = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(next.error || 'The application could not be updated.')
      setSelected(next.application)
      if (action === 'approve' || action === 'reject') {
        setData({ applications: [next.application], statistics: next.statistics || data.statistics })
        setStatus(action === 'approve' ? approvedStatus : 'Rejected')
      } else {
        if (next.statistics) setData(current => ({ ...current, statistics: next.statistics }))
        await load()
      }
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  const field = (name, value) => setSelected(current => ({ ...current, [name]: value }))
  const statistics = data.statistics

  return <AdminShell title="Adoption Applications" subtitle="Review and manage adoption applications submitted by prospective adopters.">
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-3">
      <Stat active={status === 'Submitted'} icon={Clock3} label={`Submitted (${statistics.submitted || 0})`} onClick={() => setStatus(status === 'Submitted' ? 'All Applications' : 'Submitted')} />
      <Stat icon={Check} tone="green" label={`Approved (${statistics.approved || 0})`} onClick={() => setStatus(approvedStatus)} />
      <Stat icon={X} tone="red" label={`Rejected (${statistics.rejected || 0})`} onClick={() => setStatus('Rejected')} />
    </div>
    <div className={`admin-master-detail mt-4 ${selected ? 'has-selection' : ''}`}>
      <section className="admin-app-list">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="search-box border border-brown/10"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search applicant, pet, or application…" /></label>
          <label className="sr-only" htmlFor="application-status">Filter applications</label>
          <select id="application-status" className="!m-0" value={status} onChange={event => setStatus(event.target.value)}>
            {['All Applications', 'Submitted', 'Under Review', 'Additional Information Required', approvedStatus, 'Rejected', 'Cancelled by Applicant', 'Adoption Completed'].map(option => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-brown/10 bg-white">
          {data.applications.length ? data.applications.map(application => <button key={application.id} onClick={() => setSelected(application)} className={`admin-app-row ${selected?.id === application.id ? 'selected' : ''}`}>
            <span className="avatar">{application.fullName[0]}</span>
            <span className="min-w-0 text-left"><b className="block truncate">{application.fullName}</b><small className="block truncate text-warm">{application.email}</small><small className="mt-1 block text-xs text-warm xl:hidden">{new Date(application.submittedAt).toLocaleDateString()}</small></span>
            <SiteImage src={application.petImage} alt="" className="h-12 w-12 rounded-xl" sizes="48px" />
            <span className="min-w-0 text-left"><b className="block">{application.petName}</b><small className="text-warm">{application.breed}</small></span>
            <span className="status-pill whitespace-normal text-left">{application.status}</span><ChevronRight size={18} />
          </button>) : <p className="p-8 text-center text-warm">No applications match these filters.</p>}
        </div>
      </section>
      {selected ? <ApplicationDetail application={selected} busy={busy} error={error} field={field} act={act} close={() => setSelected(null)} /> : <div className="hidden rounded-2xl bg-white p-10 text-center text-warm xl:block">Select an application to review.</div>}
    </div>
  </AdminShell>
}

function ApplicationDetail({ application, busy, error, field, act, close }) {
  const awaitingMonitoring = application.status === approvedStatus
  const finalized = finalStatuses.includes(application.status)
  return <section className="admin-app-detail rounded-2xl border border-brown/10 bg-white shadow-sm">
    <button onClick={close} className="m-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold text-orange xl:hidden"><ArrowLeft /> Back to Applications</button>
    <div className="flex flex-wrap items-center gap-4 border-b border-brown/10 p-4 sm:p-5">
      <span className="avatar h-14 w-14 text-xl">{application.fullName[0]}</span>
      <div className="min-w-0 flex-1"><h2 className="break-words text-xl font-black">{application.fullName}</h2><p className="break-words text-sm text-warm">{application.email} · {application.contact}</p><p className="text-xs text-warm">Submitted {prettyDate(application.submittedAt)}</p></div>
      <span className="status-pill whitespace-normal">{application.status}</span>
    </div>
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 min-[430px]:flex-row"><SiteImage src={application.petImage} alt={application.petName} className="h-52 w-full shrink-0 rounded-2xl min-[430px]:h-28 min-[430px]:w-28" sizes="(max-width: 429px) 100vw, 112px" /><div className="min-w-0"><h3 className="font-display text-3xl font-black">{application.petName}</h3><p className="text-warm">{application.breed} · {application.age} · {application.fixedStatus}</p><p className="mt-2 text-sm">{application.petDescription}</p></div></div>
      <Info title="Applicant Information" icon={UserRound} rows={[["Full Name", application.fullName], ["Email", application.email], ["Contact", application.contact], ["Address", application.address], ["Reason for Adoption", application.reason]]} />
      <Info title="Capability Assessment" rows={[["Housing", `${application.housingType}; pets allowed: ${application.petsAllowed}`], ["Housing details", application.housingDetails || 'Not provided'], ["Income", application.incomeRange], ["Financial support", application.financialSupport], ["Previous experience", `${application.petExperience}: ${application.experienceDetails}`]]} />
      <div className="rounded-2xl bg-cream p-4"><h3 className="font-black">Administrative Review</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{[['housingEvaluation', 'Housing'], ['financialEvaluation', 'Financial preparedness'], ['experienceEvaluation', 'Pet-care experience'], ['readinessEvaluation', 'Overall readiness']].map(([key, label]) => <label key={key} className="text-sm">{label}<select value={application[key] || ''} onChange={event => field(key, event.target.value)}>{evaluationOptions.map(option => <option key={option} value={option}>{option || 'Select evaluation'}</option>)}</select></label>)}</div><label className="mt-3 block text-sm">Internal notes<textarea rows={3} value={application.internalNotes || ''} onChange={event => field('internalNotes', event.target.value)} placeholder="Private review notes…" /></label></div>
      {awaitingMonitoring && <p className="rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">Approved and under monitoring. Review adopter updates in Monitoring &amp; Adopted, then explicitly complete the adoption when the monitoring period is finished.</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
        <button disabled={busy} onClick={() => act('saveReview')} className="btn-secondary min-h-11">Save Review</button>
        {!awaitingMonitoring && !finalized && <><button disabled={busy} onClick={() => { const message = prompt('What additional information should the applicant provide?'); if (message) act('requestInfo', { message }) }} className="btn-secondary min-h-11">Request Information</button><button disabled={busy} onClick={() => { const reason = prompt('Reason for rejection:'); if (reason) act('reject', { reason }) }} className="min-h-11 rounded-full bg-red-100 px-5 py-3 font-bold text-red-700">Reject</button><button disabled={busy} onClick={() => act('approve')} className="min-h-11 rounded-full bg-green-700 px-5 py-3 font-bold text-white">Approve</button></>}
      </div>
    </div>
  </section>
}

function Stat({ icon: Icon, label, tone = 'orange', active = false, onClick }: any) {
  return <button onClick={onClick} className={`admin-stat ${active ? 'active' : ''}`}><span className={`stat-icon ${tone}`}><Icon /></span><b>{label}</b></button>
}

function Info({ title, icon: Icon, rows }: any) {
  return <div className="rounded-2xl bg-mist p-4"><h3 className="flex items-center gap-2 font-black">{Icon && <Icon size={20} />} {title}</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{rows.map(([key, value]: [string, string]) => <div key={key} className={key.includes('Address') || key.includes('Reason') ? 'sm:col-span-2' : ''}><dt className="text-xs font-bold text-warm">{key}</dt><dd className="mt-1 rounded-xl bg-white p-3 text-sm">{value}</dd></div>)}</dl></div>
}
