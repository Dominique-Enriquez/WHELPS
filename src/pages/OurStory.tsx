import { ChevronDown, HandHeart, HeartHandshake, Megaphone, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Footer from '../components/Footer'
import SiteImage from '../components/SiteImage'
import ImagePlaceholder from '../components/ImagePlaceholder'

const faqs = [
  ['What does the name “Whelps” signify?', 'Whelps reflects our focus on young and vulnerable companion animals while honoring every rescue at every age.'],
  ['What animal care standards does Whelps follow?', 'Each animal receives appropriate shelter care, health checks, vaccinations, and rehabilitation support before adoption.'],
  ['How does Whelps manage the rehabilitation process?', 'Care plans are tailored to each rescue and can include medical treatment, nutrition, socialization, and behavior support.'],
  ['How is Whelps funded and sustained day-to-day?', 'Community donations, in-kind supplies, volunteers, and adoption support keep the shelter operating.']
]

export default function OurStory(){
  const [open,setOpen]=useState(0)
  const actions: [LucideIcon, string][]=[[ShieldCheck,'Promote Spaying and Neutering'],[HeartHandshake,'Practice Responsible Pet Ownership'],[Megaphone,'Speak Up Against Cruelty'],[HandHeart,'Support Local Shelters']]
  return <><Navbar overlay/><Hero compact imageSrc="/images/banners/our-story-dogs.webp" imageAlt="Dogs gathered for animal welfare care" title="Where Happy Beginnings Start"/><main>
    <section className="section bg-mist"><div className="site-container grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><SiteImage src="/images/story/whelps-team.jpg" alt="Whelps team with rescued dogs" className="min-h-[430px] rounded-2xl" sizes="(max-width: 1024px) 100vw, 40vw"/><div><h2 className="section-title">Our Story</h2><p className="mt-5 leading-relaxed text-warm">Driven by a shared mission to protect vulnerable animals, FurYou was developed as a dedicated digital platform in partnership with Whelps—an initiative born from a refusal to stand by while abused, abandoned, and neglected dogs and cats go without help.</p><p className="mt-4 leading-relaxed text-warm">Together, we bridge rescue and rehabilitation with responsible families, making adoption more accessible while keeping animal welfare at the center of every decision.</p></div></div>
      <div className="site-container mt-12 grid gap-4 md:grid-cols-4">{actions.map(([Icon,t])=><div className="rounded-3xl border-2 border-orange bg-white p-6 text-center" key={t}><Icon className="mx-auto text-orange"/><h3 className="mt-3 font-display text-xl font-bold">{t}</h3></div>)}</div>
      <div className="site-container mt-10 grid gap-4 md:grid-cols-3"><SiteImage src="/images/story/whelps-cats-feeding.jpg" alt="Cats receiving food at the Whelps shelter" className="h-56 rounded-2xl md:col-span-2" sizes="(max-width: 768px) 100vw, 66vw"/><ImagePlaceholder className="h-56"/></div>
    </section>
    <section className="section text-center"><div className="site-container max-w-4xl"><h2 className="section-title">Our Mission</h2><p className="mt-3 font-display text-2xl font-bold text-orange">Every animal deserves a second chance at life and a loving home.</p><p className="mt-5 text-warm">We work together to rescue, rehabilitate, and rehome abused, abandoned, and neglected animals while keeping reporting and adoption accessible to all.</p><h2 className="section-title mt-14">Our Vision</h2><p className="mt-3 font-display text-2xl font-bold text-orange">Technology and compassion can unite to create a world without animal suffering.</p></div></section>
    <section className="section bg-mist"><div className="site-container text-center"><p className="eyebrow">Our Team</p><h2 className="section-title">Team Members</h2><p className="mx-auto mt-3 max-w-2xl text-warm">The supplied group photograph above represents the Whelps team. Individual profile portraits remain open for future verified team information.</p><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{['Rescue Lead','Veterinary Liaison','Adoption Coordinator','Community Manager'].map(role=><div key={role} className="rounded-3xl bg-warm/30 p-6"><ImagePlaceholder className="mx-auto aspect-square w-full max-w-44" rounded="rounded-full"/><h3 className="mt-4 font-bold">Whelps Volunteer</h3><p className="text-sm text-warm">{role}</p></div>)}</div></div></section>
    <section className="section bg-cream"><div className="site-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><h2 className="section-title">FAQs</h2><p className="mt-3 text-warm">Got more questions? Reach out to our team anytime.</p><button className="btn-primary mt-5">Get in Touch</button></div><div>{faqs.map(([q,a],i)=><div className="border-b border-warm/30" key={q}><button onClick={()=>setOpen(open===i?-1:i)} aria-expanded={open===i} className="flex w-full items-center justify-between py-5 text-left font-bold">{q}<ChevronDown className={`transition ${open===i?'rotate-180':''}`}/></button><div className={`grid transition-all ${open===i?'grid-rows-[1fr] pb-5':'grid-rows-[0fr]'}`}><p className="overflow-hidden text-warm">{a}</p></div></div>)}</div></div></section>
  </main><Footer/></>
}
