import './Marquee.css'

export function Marquee({ direction = 'rtl', text, className = '' }) {
  return (
    <div
      className={`marquee marquee--${direction} ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="marquee__track">
        <span className="marquee__copy">{text}</span>
        <span className="marquee__copy">{text}</span>
      </div>
    </div>
  )
}
