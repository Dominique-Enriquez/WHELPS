import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, Home, PawPrint, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

const steps = [
  ['Adoption Application', 'Applicant information'],
  ['Capability Assessment', 'Housing, income, experience'],
  ['Review and Submit', 'Check your information']
]

const initialForm = (user: {name?: string; email?: string} | null) => ({
  fullName: user?.name || '', email: user?.email || '', contact: '', address: '', reason: '',
  housingType: '', petsAllowed: '', housingDetails: '', incomeRange: '', financialSupport: '',
  petExperience: '', experienceDetails: '', confirmed: false
})

type AdoptionForm = ReturnType<typeof initialForm>

export default function AdoptionApplication({ pet, user, onCancel }: {pet: any; user: {name?: string; email?: string} | null; onCancel: () => void}) {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [form, setForm] = useState(() => initialForm(user))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [activeApplication, setActiveApplication] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => { fetch('/api/applications').then(r=>r.ok?r.json():Promise.reject()).then(data=>setActiveApplication(data.active)).catch(()=>{}).finally(()=>setChecking(false)) }, [])
  const update = <K extends keyof AdoptionForm>(field: K, value: AdoptionForm[K]) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => ({ ...prev, [field]: '' })) }

  const validate = (target = step) => {
    const next: Record<string, string> = {}
    if (target === 0) {
      if (!form.fullName.trim()) next.fullName = 'Full name is required.'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
      if (!/^(?:\+63|0)9\d{9}$/.test(form.contact.replace(/[\s-]/g, ''))) next.contact = 'Enter a valid Philippine mobile number.'
      if (!form.address.trim()) next.address = 'Address is required.'
      if (!form.reason.trim()) next.reason = 'Tell us why you would like to adopt this pet.'
    }
    if (target === 1) {
      if (!form.housingType) next.housingType = 'Select your housing type.'
      if (!form.petsAllowed) next.petsAllowed = 'Choose Yes or No.'
      if (!form.incomeRange) next.incomeRange = 'Select an income range.'
      if (!form.financialSupport.trim()) next.financialSupport = 'Explain how you support your pet-care expenses.'
      if (!form.petExperience) next.petExperience = 'Choose Yes or No.'
      if (!form.experienceDetails.trim()) next.experienceDetails = 'Describe your experience or readiness.'
    }
    if (target === 2 && !form.confirmed) next.confirmed = 'You must confirm the information before submitting.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const nextStep = () => {
    if (!validate()) return
    setCompleted(prev => [...new Set([...prev, step])])
    setStep(current => Math.min(current + 1, 2))
  }

  const submit = async () => {
    if (!validate(2)) return
    setSubmitting(true); setSubmitError('')
    try {
      const response=await fetch('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({petId:pet.id,...form})})
      const data=await response.json()
      if(!response.ok){if(data.activeApplication)setActiveApplication(data.activeApplication);throw new Error(data.error||'The application could not be submitted.')}
      setSubmitted(true)
    } catch (error) { setSubmitError(error instanceof Error ? error.message : 'The application could not be submitted.') }
    finally { setSubmitting(false) }
  }

  const reasonCount = useMemo(() => form.reason.length, [form.reason])
  if(checking)return <div className="rounded-3xl bg-white p-10 text-center shadow-soft"><p className="font-bold text-warm">Checking your application eligibilityâ€¦</p></div>
  if(activeApplication)return <div className="rounded-3xl bg-white p-8 text-center shadow-soft"><AlertCircle className="mx-auto text-orange" size={48}/><h3 className="mt-4 font-display text-4xl font-black">You already have an active request</h3><p className="mx-auto mt-3 max-w-2xl text-warm">You currently have an adoption request for <strong>{activeApplication.petName}</strong>. Please wait for Whelps to review it or cancel your current request before applying for another pet.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="btn-primary">View Current Application</Link><button onClick={onCancel} className="btn-secondary">Return to Browse Pets</button></div></div>
  if (submitted) return <div className="rounded-3xl bg-white p-8 text-center shadow-soft"><CheckCircle2 className="mx-auto text-orange" size={52}/><h3 className="mt-4 font-display text-4xl font-black">Application Submitted Successfully!</h3><p className="mx-auto mt-3 max-w-2xl text-warm">Your adoption application has been submitted to Whelps Animal Care & Rehabilitation Center for review. You will be notified once there is an update on your application.</p><p className="mt-3 text-sm font-bold text-orange">Status: Submitted â€” this is not an adoption approval.</p><button onClick={onCancel} className="btn-primary mt-7">Return to Pet Details</button></div>

  return <div>
    <div className="mb-5 grid grid-cols-3 gap-1 sm:mb-7 sm:gap-2">{steps.map(([title,subtitle],i)=><button key={title} type="button" onClick={()=>completed.includes(i)||i<step?setStep(i):null} className={`step-tab min-w-0 ${step===i?'active':completed.includes(i)?'complete':''}`}><span>{completed.includes(i)?<Check size={16}/>:i+1}</span><strong className="truncate sm:whitespace-normal">{title}</strong><small>{subtitle}</small></button>)}</div>
    {step===0 && <section><StepHeading number="1" title="Adoption Application" copy="Provide your information and answer a few questions about your adoption request."/><div className="form-grid"><Field label="Full Name" error={errors.fullName}><input value={form.fullName} onChange={e=>update('fullName',e.target.value)} /></Field><Field label="Email Address" error={errors.email}><input type="email" value={form.email} onChange={e=>update('email',e.target.value)} /></Field><Field label="Contact Number" error={errors.contact}><input type="tel" placeholder="+63 916 123 4567" value={form.contact} onChange={e=>update('contact',e.target.value)} /></Field><Field label="Address" error={errors.address}><input placeholder="House No., Street, Barangay, City, Province" value={form.address} onChange={e=>update('address',e.target.value)} /></Field><Field label={`Why do you want to adopt ${pet.name}?`} error={errors.reason} wide><textarea maxLength={500} rows={4} placeholder={`Share your reason for adopting ${pet.name}...`} value={form.reason} onChange={e=>update('reason',e.target.value)}/><span className="counter">{reasonCount}/500</span></Field></div></section>}
    {step===1 && <section><StepHeading number="2" title="Capability Assessment" copy="Help us understand your ability to provide proper care for a pet."/><div className="grid gap-5 lg:grid-cols-3"><AssessmentCard icon={Home} title="Housing Conditions"><Field label="What type of housing do you live in?" error={errors.housingType}><select value={form.housingType} onChange={e=>update('housingType',e.target.value)}><option value="">Select your housing type</option>{['Own House','Rented House','Apartment','Condominium','Living with Family','Other'].map(x=><option key={x}>{x}</option>)}</select></Field><RadioField label="Are pets allowed in your residence?" name="petsAllowed" value={form.petsAllowed} update={update} error={errors.petsAllowed}/>{form.petsAllowed==='No'&&<p className="notice"><AlertCircle size={16}/>This may affect suitability and will require Whelps review. It does not automatically reject the application.</p>}<Field label="Additional details about your living situation"><textarea rows={3} placeholder="Additional details about your living situation (e.g. house, apartment, with family, etc.)" value={form.housingDetails} onChange={e=>update('housingDetails',e.target.value)}/></Field></AssessmentCard>
      <AssessmentCard icon={WalletCards} title="Income"><Field label="What is your monthly income range?" error={errors.incomeRange}><select value={form.incomeRange} onChange={e=>update('incomeRange',e.target.value)}><option value="">Select your income range</option>{['Below â‚±5,000','â‚±5,000â€“â‚±9,999','â‚±10,000â€“â‚±19,999','â‚±20,000â€“â‚±29,999','â‚±30,000â€“â‚±49,999','â‚±50,000 and above','Prefer not to disclose'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="How do you financially support yourself? (e.g. allowance, employment, business, etc.)" error={errors.financialSupport}><textarea rows={4} placeholder="Provide details..." value={form.financialSupport} onChange={e=>update('financialSupport',e.target.value)}/></Field><p className="text-xs text-warm">Used only to understand preparedness for food, shelter, and veterinary care.</p></AssessmentCard>
      <AssessmentCard icon={PawPrint} title="Previous Pet-Care Experience"><RadioField label="Have you cared for a pet before?" name="petExperience" value={form.petExperience} update={update} error={errors.petExperience}/><Field label={form.petExperience==='No'?'Describe your readiness as a first-time pet owner.':'Please describe your experience. (e.g. type of pets, duration, responsibilities)'} error={errors.experienceDetails}><textarea rows={5} placeholder="Share your experience..." value={form.experienceDetails} onChange={e=>update('experienceDetails',e.target.value)}/></Field><p className="text-xs text-warm">First-time pet owners are welcome and are assessed on overall readiness.</p></AssessmentCard></div></section>}
    {step===2 && <section><StepHeading number="3" title="Review and Submit" copy="Check your information before submitting it to Whelps for review."/><div className="grid gap-5 md:grid-cols-2"><Review title="Adoption Information" edit={()=>setStep(0)} rows={[['Selected pet',pet.name],['Applicant',form.fullName],['Email',form.email],['Contact',form.contact],['Address',form.address],['Reason',form.reason]]}/><Review title="Housing Conditions" edit={()=>setStep(1)} rows={[['Housing type',form.housingType],['Pets allowed',form.petsAllowed],['Living details',form.housingDetails||'Not provided']]}/><Review title="Income" edit={()=>setStep(1)} rows={[['Monthly range',form.incomeRange],['Financial support',form.financialSupport]]}/><Review title="Pet-Care Experience" edit={()=>setStep(1)} rows={[['Cared for a pet before',form.petExperience],['Experience or readiness',form.experienceDetails]]}/></div><label className="mt-6 flex items-start gap-3 rounded-2xl bg-white p-5 text-sm"><input type="checkbox" className="mt-0.5 w-auto" checked={form.confirmed} onChange={e=>update('confirmed',e.target.checked)}/><span>I confirm that the information I provided is accurate, and I understand that my adoption application will be reviewed by Whelps Animal Care & Rehabilitation Center.</span></label>{errors.confirmed&&<ErrorText>{errors.confirmed}</ErrorText>}{submitError&&<p className="notice mt-4"><AlertCircle size={18}/>{submitError}</p>}</section>}
    <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end"><button type="button" onClick={step===0?onCancel:()=>setStep(step-1)} className="btn-secondary min-h-11"><ChevronLeft size={17}/>{step===0?'Cancel':'Previous'}</button>{step<2?<button type="button" onClick={nextStep} className="btn-primary min-h-11">Next <ChevronRight size={17}/></button>:<button type="button" disabled={submitting} onClick={submit} className="btn-primary min-h-11 disabled:opacity-60">{submitting?'Submittingâ€¦':'Submit Application'} <ChevronRight size={17}/></button>}</div>
  </div>
}

function StepHeading({number,title,copy}: {number: string; title: string; copy: string}){return <div className="mb-5 flex gap-3 rounded-2xl bg-orange/10 p-4 sm:gap-4 sm:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange font-bold text-white">{number}</span><div className="min-w-0"><h3 className="font-display text-2xl font-bold sm:text-3xl">{title}</h3><p className="text-sm text-warm">{copy}</p></div></div>}
function Field({label,error,wide=false,children}: {label: string; error?: string; wide?: boolean; children: ReactNode}){return <label className={`relative block ${wide?'md:col-span-2':''}`}>{label}{children}{error&&<ErrorText>{error}</ErrorText>}</label>}
function ErrorText({children}: {children: ReactNode}){return <span className="mt-1 block text-xs font-semibold text-red-700" role="alert">{children}</span>}
function RadioField({label,name,value,update,error}: {label: string; name: keyof AdoptionForm; value: string; update: <K extends keyof AdoptionForm>(field: K, value: AdoptionForm[K]) => void; error?: string}){return <fieldset className="mt-4"><legend className="font-bold text-warm">{label}</legend><div className="mt-2 flex gap-6">{['Yes','No'].map(option=><label key={option} className="flex items-center gap-2 text-ink"><input className="m-0 w-auto" type="radio" name={name} checked={value===option} onChange={()=>update(name,option)}/>{option}</label>)}</div>{error&&<ErrorText>{error}</ErrorText>}</fieldset>}
function AssessmentCard({icon:Icon,title,children}: {icon: LucideIcon; title: string; children: ReactNode}){return <div className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Icon className="text-orange"/><h4 className="font-display text-2xl font-bold">{title}</h4></div><div className="mt-5 space-y-4">{children}</div></div>}
function Review({title,rows,edit}: {title: string; rows: [string, ReactNode][]; edit: () => void}){return <div className="rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h4 className="font-display text-2xl font-bold">{title}</h4><button onClick={edit} className="text-sm font-bold text-orange">Edit Information</button></div><dl className="mt-4 space-y-3">{rows.map(([label,value])=><div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-warm">{label}</dt><dd className="mt-0.5 break-words">{value}</dd></div>)}</dl></div>}
