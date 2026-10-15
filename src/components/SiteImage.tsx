import Image from 'next/image'

export default function SiteImage({ src, alt, className = '', imageClassName = '', sizes = '100vw', priority = false, contain = false, unoptimized = false }) {
  const embeddedImage=typeof src==='string'&&(src.startsWith('data:')||src.startsWith('blob:'))
  return (
    <div className={`relative overflow-hidden bg-[#e4ddd0] ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={unoptimized||embeddedImage} className={`${contain ? 'object-contain' : 'object-cover'} ${imageClassName}`} />
    </div>
  )
}
