const InventoryStatus = () => {
  const inventory = [
    { status: 'In Stock', count: 234, percentage: 62, color: 'bg-green-500' },
    { status: 'Low Stock', count: 89, percentage: 24, color: 'bg-amber-500' },
    { status: 'Overstock', count: 47, percentage: 12, color: 'bg-blue-500' },
  ]

  const total = inventory.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-900 mb-3">Inventory Status</h3>
      
      {/* Progress Bar */}
      <div className="flex h-6 gap-0.5 rounded-lg overflow-hidden mb-3 border border-gray-100">
        {inventory.map((item) => (
          <div
            key={item.status}
            className={`${item.color} transition-all flex-shrink-0`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.status}: ${item.count}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {inventory.map((item) => (
          <div key={item.status} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-gray-700">{item.status}</span>
            </div>
            <div className="font-medium text-gray-900">{item.count} ({item.percentage}%)</div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-600 text-center">
        Total: <span className="font-semibold text-gray-900">{total} vehicles</span>
      </div>
    </div>
  )
}

export default InventoryStatus
