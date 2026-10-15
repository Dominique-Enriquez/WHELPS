export default function ImagePlaceholder({ className = '', rounded = 'rounded-2xl' }) {
  return <div aria-hidden="true" className={`image-placeholder ${rounded} ${className}`} />
}
