import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Search } from 'lucide-react'

// Fix default marker icons in Leaflet with Vite.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}

const parseCsv = (text) => {
  if (!text) return []
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      if (row.length > 1 || row[0]) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows.shift().map((h) => h.trim())
  return rows.map((cols) => {
    const record = {}
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? ''
    })
    return record
  })
}

const MapUpdater = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

const SalesMap = () => {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795])
  const [zoom, setZoom] = useState(4)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const text = await fetch('/dealer_sales_summary_simple.csv').then((r) => r.text())
        if (!active) return
        const rows = parseCsv(text)
        const mapped = rows.map((d) => ({
          canonical_dealer_id: d.canonical_dealer_id,
          mc_dealer_id: d.mc_dealer_id,
          seller_name: d.seller_name,
          city: d.city,
          state: d.state,
          latitude: toNumber(d.latitude),
          longitude: toNumber(d.longitude),
          total_sales: toNumber(d.total_sales),
          active_inventory: toNumber(d.active_inventory),
        }))
        setDealers(mapped)
        setError('')
      } catch (err) {
        if (!active) return
        setError('Unable to load dealer map data.')
        setDealers([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const mapDealers = useMemo(() => {
    return dealers
      .filter((d) => d.latitude && d.longitude)
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 75)
  }, [dealers])

  const filteredDealers = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return dealers.filter((d) => (
      d.seller_name?.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q) ||
      d.state?.toLowerCase().includes(q) ||
      d.mc_dealer_id?.toLowerCase().includes(q)
    )).slice(0, 8)
  }, [dealers, query])

  const handleSelect = (dealer) => {
    setSelectedDealer(dealer)
    if (dealer.latitude && dealer.longitude) {
      setMapCenter([dealer.latitude, dealer.longitude])
      setZoom(8)
    }
  }

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-3 flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 lg:h-[calc(100vh-140px)] min-h-0 overflow-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-900">Find a Dealer</div>
              <div className="text-[10px] text-slate-500">Search by name, city, or ID</div>
            </div>
          </div>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name, city, or ID"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            {filteredDealers.length > 0 && (
              <div className="mt-2 space-y-2">
                {filteredDealers.map((dealer) => (
                  <button
                    key={dealer.canonical_dealer_id}
                    onClick={() => handleSelect(dealer)}
                    className="w-full text-left rounded-lg border border-gray-100 bg-slate-50 px-2.5 py-2 hover:bg-slate-100"
                  >
                    <div className="text-[11px] font-semibold text-slate-900 truncate">{dealer.seller_name}</div>
                    <div className="text-[10px] text-slate-500">{dealer.city}, {dealer.state}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-2 lg:h-[calc(100vh-140px)] min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1">
            <div>
              <div className="text-[12px] font-semibold text-slate-900">Sales Territory Map</div>
              <div className="text-[10px] text-slate-500">Top dealers by sales volume</div>
            </div>
            <div className="text-[10px] text-slate-400">Showing {mapDealers.length}</div>
          </div>
          <div className="rounded-xl overflow-hidden flex-1 min-h-[420px] lg:min-h-0">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              className="w-full h-full"
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} zoom={zoom} />
              {mapDealers.map((dealer) => (
                <Marker
                  key={dealer.canonical_dealer_id}
                  position={[dealer.latitude, dealer.longitude]}
                  eventHandlers={{
                    click: () => handleSelect(dealer)
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900">{dealer.seller_name}</div>
                      <div className="text-slate-500">{dealer.city}, {dealer.state}</div>
                      <div className="mt-1">Sales: {dealer.total_sales.toLocaleString()}</div>
                      <div>Inventory: {dealer.active_inventory.toLocaleString()}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {loading && <div className="text-[10px] text-slate-500 mt-2">Loading map data…</div>}
          {error && <div className="text-[10px] text-rose-600 mt-2">{error}</div>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-3 lg:h-[calc(100vh-140px)] min-h-0 overflow-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-900">Compare Dealers</div>
              <div className="text-[10px] text-slate-500">Click a marker to view details</div>
            </div>
          </div>
          {selectedDealer ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-gray-100 bg-slate-50 p-2">
                <div className="text-[11px] font-semibold text-slate-900">{selectedDealer.seller_name}</div>
                <div className="text-[10px] text-slate-500">{selectedDealer.city}, {selectedDealer.state}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-gray-100 p-2">
                  <div className="text-[10px] text-slate-500">Total Sales</div>
                  <div className="text-[12px] font-semibold text-slate-900">{selectedDealer.total_sales.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-gray-100 p-2">
                  <div className="text-[10px] text-slate-500">Active Inventory</div>
                  <div className="text-[12px] font-semibold text-slate-900">{selectedDealer.active_inventory.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-[10px] text-slate-500">
              Select a dealer from the map to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesMap
