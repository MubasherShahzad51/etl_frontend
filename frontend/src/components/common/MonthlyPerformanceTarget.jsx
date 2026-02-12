const MonthlyPerformanceTarget = () => {
  const current = 67
  const target = 85
  const percentage = Math.round((current / target) * 100)
  const gap = target - current

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-900 mb-3">Feb Sales Goal</h3>
      
      <div className="space-y-2">
        {/* Main Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progress to Target</span>
            <span className="text-sm font-bold text-gray-900">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${percentage >= 100 ? 'bg-green-500' : percentage >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-blue-50 p-2 rounded-lg text-center">
            <div className="text-xs text-gray-600">Current</div>
            <div className="font-bold text-sm text-blue-600">${current}k</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <div className="text-xs text-gray-600">Target</div>
            <div className="font-bold text-sm text-gray-900">${target}k</div>
          </div>
          <div className="bg-amber-50 p-2 rounded-lg text-center">
            <div className="text-xs text-gray-600">Gap</div>
            <div className="font-bold text-sm text-amber-600">${gap}k</div>
          </div>
        </div>

        {/* Message */}
        <div className={`text-xs pt-1 text-center font-medium ${gap <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
          {gap <= 0 ? '✓ Target achieved!' : `Need $${gap}k more to reach goal`}
        </div>
      </div>
    </div>
  )
}

export default MonthlyPerformanceTarget
