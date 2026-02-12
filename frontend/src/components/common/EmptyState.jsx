import { FileQuestion, Search } from 'lucide-react'

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = 'No data found', 
  description = 'Try adjusting your search or filters',
  action,
  actionLabel,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      iconWrapper: 'p-3',
      icon: 'w-6 h-6',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-16 px-6',
      iconWrapper: 'p-5',
      icon: 'w-10 h-10',
      title: 'text-xl',
      description: 'text-sm',
    },
    lg: {
      container: 'py-24 px-8',
      iconWrapper: 'p-6',
      icon: 'w-14 h-14',
      title: 'text-2xl',
      description: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className={`flex flex-col items-center justify-center ${classes.container} animate-fade-in`}>
      {/* Decorative background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full blur-2xl opacity-50 scale-150" />
        <div className={`relative ${classes.iconWrapper} bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-inner`}>
          <Icon className={`${classes.icon} text-gray-400`} />
        </div>
      </div>
      
      <h3 className={`${classes.title} font-bold text-gray-900 mt-6 mb-2`}>{title}</h3>
      <p className={`${classes.description} text-gray-500 text-center max-w-sm`}>{description}</p>
      
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-6 btn-primary"
        >
          {actionLabel}
        </button>
      )}

      {/* Decorative dots */}
      <div className="flex items-center gap-1.5 mt-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full bg-gray-300 animate-pulse`}
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default EmptyState
