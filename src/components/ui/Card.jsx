// Themed panel container. `as` lets it render a different element if needed.
export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-panel border border-panel-2 rounded-xl shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
