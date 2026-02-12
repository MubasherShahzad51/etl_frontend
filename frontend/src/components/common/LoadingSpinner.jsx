const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer glow */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-primary-500/20 blur-sm`} />
        
        {/* Main spinner */}
        <div
          className={`${sizeClasses[size]} border-gray-200 border-t-primary-500 rounded-full animate-spin`}
        />
        
        {/* Center dot */}
        {size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-primary-500 rounded-full animate-pulse`} />
          </div>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner
