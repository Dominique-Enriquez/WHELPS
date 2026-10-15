import { ArrowRight, CheckCircle2, FileText, Heart, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import SiteImage from '../components/SiteImage'
import DonationBanner from '../components/DonationBanner'
import { pets } from '../data/pets'

const stats = [['10', 'Pets Available'], ['55', 'Successfully Adopted'], ['89', 'Happy Families'], ['100%', 'Verified & Healthy Pets']]
const benefits: [LucideIcon, string, string][] = [[CheckCircle2, 'Verified Pets', 'Every pet is health-checked, vaccinated, and ready for adoption.'], [FileText, 'Professional Screening', 'Thoughtful assessment helps each pet reach the right home.'], [MessageCircle, 'Direct Support', 'Guidance from Whelps staff throughout your journey.'], [Heart, 'Lifetime Commitment', 'Support that continues after adoption day.']]

export default function Home() {
  return <div className="bg-white">
    <Navbar overlay/>
    <Hero imageSrc="/images/hero/home-pawfect.png" imageAlt="Cat featured on the FurYou adoption homepage" imageClassName="object-center" title="Find Your Pawfect Companion" subtitle="Rescue a pet from Whelps Animal Care & Rehabilitation Center and give them a loving home.">
      <Link href="/pets" className="btn-light">Browse Pets</Link><Link href="/our-story" className="btn-outline-light">Learn More</Link>
    </Hero>
    <section className="bg-warm text-white"><div className="site-container grid grid-cols-2 md:grid-cols-4">{stats.map(([n,l]) => <div key={l} className="py-8 text-center"><strong className="font-display text-4xl">{n}</strong><p className="text-sm">{l}</p></div>)}</div></section>
    <section className="section bg-cream"><div className="site-container grid items-center gap-12 lg:grid-cols-2"><div><p className="eyebrow">Our Story</p><h2 className="section-title">FurYou & Whelps</h2><p className="mt-6 text-lg leading-relaxed text-warm">FurYou is a web-based platform dedicated to connecting rescued pets with loving, responsible families. In partnership with Whelps, we make adoption thoughtful, transparent, and personal.</p><p className="mt-4 leading-relaxed text-warm">Every animal deserves a safe, loving home. Our process helps adopters discover verified pets and receive direct guidance from rescue staff.</p><Link className="btn-secondary mt-7" href="/our-story">Learn More <ArrowRight size={16}/></Link></div><div className="grid grid-cols-2 gap-4"><SiteImage src="/images/story/whelps-team.jpg" alt="Whelps team with rescued dogs" className="h-48 rounded-2xl" sizes="(max-width: 1024px) 50vw, 25vw"/><SiteImage src="/images/story/whelps-cats-feeding.jpg" alt="Whelps shelter cats during feeding time" className="h-48 translate-y-8 rounded-2xl" sizes="(max-width: 1024px) 50vw, 25vw"/><SiteImage src={pets[3].image} alt="Sample adoptable cat" className="h-48 rounded-2xl" sizes="(max-width: 1024px) 50vw, 25vw"/><SiteImage src={pets[2].image} alt="Sample adoptable dog" className="h-48 translate-y-8 rounded-2xl" sizes="(max-width: 1024px) 50vw, 25vw"/></div></div></section>
    <section className="section"><div className="site-container text-center"><p className="eyebrow">Successful Stories</p><h2 className="section-title mx-auto max-w-3xl">Tales of hope, recovery, and joyful fresh starts.</h2><p className="mt-3 text-orange">Illustrative stories featuring sample pet photography.</p><div className="mt-10 grid gap-5 md:grid-cols-3">{pets.slice(0,3).map((pet) => <article className="overflow-hidden rounded-2xl bg-warm text-left text-white" key={pet.id}><SiteImage src={pet.image} alt={`Sample photograph of ${pet.name}`} className="h-60" sizes="(max-width: 768px) 100vw, 33vw"/><div className="p-6"><h3 className="font-display text-2xl font-bold">{pet.name}&apos;s new beginning</h3><p className="mt-2 text-sm text-white/80">A demonstration of the hopeful outcomes responsible adoption can make possible.</p></div></article>)}</div><Link className="btn-secondary mt-8" href="/success-stories">View All Happy Adoption Tales</Link></div></section>
    <section className="section bg-brown text-white"><div className="site-container"><h2 className="section-title">Meet friendly faces waiting for you!</h2><p className="mt-3 max-w-3xl text-white/75">Explore sample profiles and discover what to consider when choosing a companion.</p><div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">{pets.slice(0,4).map(p => <div key={p.id}><SiteImage src={p.image} alt={`Sample pet ${p.name}`} className="h-72 rounded-xl" sizes="(max-width: 768px) 50vw, 25vw"/><p className="mt-3 text-center font-display text-2xl">{p.name}</p></div>)}</div><div className="text-center"><Link href="/pets" className="btn-primary mt-8">Adopt Now</Link></div></div></section>
    <section className="section"><div className="site-container text-center"><h2 className="section-title">Why Choose FurYou?</h2><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([Icon,title,text]) => <div className="rounded-3xl bg-mist p-7" key={title}><Icon className="mx-auto text-orange" size={32}/><h3 className="mt-4 font-display text-2xl font-bold">{title}</h3><p className="mt-2 text-sm text-warm">{text}</p></div>)}</div></div></section>
    <DonationBanner/><Footer/>
  </div>
}
