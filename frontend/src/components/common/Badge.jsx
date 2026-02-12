const Badge = ({ label, color = 'gray', size = 'md', dot = false, pulse = false }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-rose-50 text-rose-700 ring-rose-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
    primary: 'bg-primary-50 text-primary-700 ring-primary-200',
    accent: 'bg-orange-50 text-orange-700 ring-orange-200',
  }

  const dotColors = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    purple: 'bg-purple-500',
    primary: 'bg-primary-500',
    accent: 'bg-orange-500',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ring-1 ring-inset
        ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {label}
    </span>
  )
}

export default Badge
