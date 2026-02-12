import { useState } from 'react'

const RadiusSlider = ({ value, onChange, min = 15, max = 50 }) => {
  const [isDragging, setIsDragging] = useState(false)
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">Search Radius</label>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold transition-colors duration-200 ${
            isDragging ? 'text-primary-600' : 'text-gray-900'
          }`}>
            {value}
          </span>
          <span className="text-sm text-gray-500">miles</span>
        </div>
      </div>
      
      <div className="relative py-2">
        {/* Track background */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          {/* Active track */}
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-100"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Input range (invisible, for interaction) */}
        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Custom thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-primary-500 rounded-full shadow-lg pointer-events-none
            transition-transform duration-200 ${isDragging ? 'scale-125' : ''}`}
          style={{ left: `calc(${percentage}% - 12px)` }}
        >
          {isDragging && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-lg whitespace-nowrap">
              {value} mi
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between text-xs font-medium text-gray-400">
        <span>{min} mi</span>
        <span>{Math.round((max + min) / 2)} mi</span>
        <span>{max} mi</span>
      </div>
    </div>
  )
}

export default RadiusSlider
