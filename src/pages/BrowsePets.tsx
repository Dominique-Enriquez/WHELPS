import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Footer from '../components/Footer'
import PetCard from '../components/PetCard'
import PetDetailModal from '../components/PetDetailModal'
import DonationBanner from '../components/DonationBanner'
import { useAvailablePets } from '../hooks/useAvailablePets'

export default function BrowsePets({ authenticated = false }) {
  const {pets,loading,error,reload}=useAvailablePets()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [age, setAge] = useState('All')
  const [gender, setGender] = useState('All')
  const [detail, setDetail] = useState(null)
  const [apply, setApply] = useState(false)
  const filtered = useMemo(() => pets.filter(p => (type === 'All' || p.type === type) && (age === 'All' || p.ageGroup === age) && (gender === 'All' || p.gender === gender) && `${p.name} ${p.breed}`.toLowerCase().includes(query.toLowerCase())), [query,type,age,gender])
  const show = (pet, shouldApply = false) => { setDetail(pet); setApply(shouldApply) }
  const filters: [string, string, Dispatch<SetStateAction<string>>, string[]][] = [['Pet Type',type,setType,['All','Dog','Cat']],['Age',age,setAge,['All','Young','Adult']],['Gender',gender,setGender,['All','Male','Female']]]
  return <div className="bg-mist"><Navbar overlay={!authenticated}/>{!authenticated && <Hero compact imageSrc="/images/banners/browse-cats.webp" imageAlt="Cats resting together" imageClassName="object-center" title="Find Your New Best Friend"/>}<main className="section"><div className="site-container">
    {authenticated && <div className="mb-10 rounded-[2rem] bg-white p-8 md:p-10"><p className="eyebrow">Welcome back</p><h1 className="section-title">Ready to find your new best friend?</h1></div>}
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Adoptable Pets</p><h2 className="section-title">Available for You</h2></div><div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap"><label className="search-box col-span-2 w-full sm:min-w-64"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search pets" aria-label="Search pets"/></label>{filters.map(([label,value,setter,opts]) => <label className="filter-select min-h-11 min-w-0" key={label}><SlidersHorizontal size={15}/><span className="sr-only">{label}</span><select className="min-w-0" value={value} onChange={e=>setter(e.target.value)}>{opts.map(x=><option key={x}>{x}</option>)}</select></label>)}</div></div>
    {loading?<div className="rounded-3xl bg-white p-8 text-center text-warm sm:p-14">Loading available pets…</div>:error?<div className="rounded-3xl bg-red-50 p-8 text-center text-red-700 sm:p-14"><h3 className="font-display text-3xl font-bold">Pets could not be loaded.</h3><p className="mt-2">{error}</p><button onClick={reload} className="btn-primary mt-5">Try Again</button></div>:filtered.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">{filtered.map(pet=><PetCard key={pet.id} pet={pet} onDetails={show}/>)}</div> : <div className="rounded-3xl bg-white p-8 text-center sm:p-14"><h3 className="font-display text-3xl font-bold">No pets match those filters.</h3><button onClick={()=>{setQuery('');setType('All');setAge('All');setGender('All')}} className="btn-primary mt-5">Reset filters</button></div>}
  </div></main><DonationBanner/><Footer/>{detail && <PetDetailModal key={`${detail.id}-${apply}`} pet={detail} initialApply={apply} onClose={()=>{setDetail(null);setApply(false)}}/>}</div>
}
