import ImagePlaceholder from './ImagePlaceholder'
import SiteImage from './SiteImage'

export default function Hero({ title, subtitle, children, compact = false, imageSrc, imageAlt = '', imageClassName = '' }) {
  return (
    <section className={`relative isolate overflow-hidden ${compact ? 'min-h-[390px]' : 'min-h-[620px]'} flex items-center justify-center bg-brown text-center text-white`}>
      {imageSrc ? <SiteImage src={imageSrc} alt={imageAlt} priority className="!absolute inset-0 h-full w-full" imageClassName={imageClassName} /> : <ImagePlaceholder className="absolute inset-0 h-full w-full opacity-35" rounded="rounded-none"/>}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-brown/45 to-brown/70" />
      <div className="relative z-10 site-container pt-20">
        <h1 className="display-title mx-auto max-w-4xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">{subtitle}</p>}
        {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  )
}
