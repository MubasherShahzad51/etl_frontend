const DealerSnapshot = ({ dealer = {} }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 text-sm">
      <h5 className="font-semibold text-gray-900 mb-2">Dealer Snapshot</h5>
      <div className="text-xs text-gray-600 mb-2">{dealer.seller_name || '—'}</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <div className="font-semibold text-gray-900">Rank</div>
          <div className="mt-1">#4 / 12</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">Competitors</div>
          <div className="mt-1">{dealer.competitorsNearby || 8}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">States</div>
          <div className="mt-1">{dealer.states || 1}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">Total Sales</div>
          <div className="mt-1">{dealer.totalSales ? dealer.totalSales : '245'}</div>
        </div>
      </div>
    </div>
  )
}

export default DealerSnapshot
