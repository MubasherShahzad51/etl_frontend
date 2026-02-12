import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, MapPin, TrendingUp, Car, Phone, Mail, ExternalLink } from 'lucide-react'

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Create numbered marker icon
const createNumberedIcon = (number, isTarget = false) => {
  const size = isTarget ? 48 : 40
  const bgColor = isTarget 
    ? 'linear-gradient(135deg, #3385ff 0%, #1a65f5 100%)'
    : number <= 3 
      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      : number <= 6 
        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  
  const shadowColor = isTarget ? 'rgba(51,133,255,0.5)' : 
    number <= 3 ? 'rgba(239,68,68,0.5)' : 
    number <= 6 ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bgColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px ${shadowColor};
      border: 3px solid white;
      color: white;
      font-weight: 800;
      font-size: ${isTarget ? '18px' : '16px'};
      cursor: pointer;
      transition: transform 0.2s;
    ">${isTarget ? '★' : number}</div>
  `

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Component to update map view when props change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

// Clickable marker component
const ClickableMarker = ({ position, icon, onClick, children }) => {
  const map = useMapEvents({})
  
  return (
    <Marker 
      position={position} 
      icon={icon}
      eventHandlers={{
        click: onClick
      }}
    >
      {children}
    </Marker>
  )
}

// Modal Component
const CompetitorModal = ({ competitor, isOpen, onClose, isTarget = false }) => {
  if (!isOpen) return null

  const getThreatLevel = (rank) => {
    if (rank <= 3) return { label: 'High Threat', color: 'bg-rose-500', textColor: 'text-rose-600', bgLight: 'bg-rose-50' }
    if (rank <= 6) return { label: 'Medium Threat', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' }
    return { label: 'Low Threat', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' }
  }

  const threat = !isTarget ? getThreatLevel(competitor.competitor_rank || 99) : null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`p-6 ${isTarget ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 
          competitor.competitor_rank <= 3 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
          competitor.competitor_rank <= 6 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
          'bg-gradient-to-r from-emerald-500 to-emerald-600'
        } text-white`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {isTarget ? '★' : competitor.competitor_rank}
            </div>
            <div>
              <h2 className="text-xl font-bold">{competitor.seller_name}</h2>
              <div className="flex items-center gap-2 mt-1 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {isTarget ? `${competitor.city}, ${competitor.state}` : `${competitor.distance_miles?.toFixed(1)} miles away`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isTarget ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">This is your dealership</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full font-semibold">
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                  Target Location
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Threat Level */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-500 text-sm">Threat Level</span>
                <span className={`px-3 py-1 ${threat.bgLight} ${threat.textColor} rounded-full text-sm font-semibold`}>
                  {threat.label}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{competitor.shared_makes?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Shared Makes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{competitor.shared_model_sales?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Competing Sales</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{competitor.shared_models?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Shared Models</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{competitor.distance_miles?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Miles Away</p>
                </div>
              </div>

              {/* Shared Makes */}
              {competitor.shared_makes?.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Competing Makes</p>
                  <div className="flex flex-wrap gap-2">
                    {competitor.shared_makes.map((make) => (
                      <span key={make} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        {make}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Full Analysis
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const CompetitorMap = ({ 
  targetDealer, 
  competitors = [], 
  radius = 25,
  center = [30.4515, -91.1871],
  zoom = 10,
  onSelectCompetitor
}) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null)
  const [isTargetSelected, setIsTargetSelected] = useState(false)

  // Convert radius from miles to meters
  const radiusInMeters = radius * 1609.34

  // Generate competitor positions around center
  const getCompetitorPosition = (index, total, distance) => {
    const angle = (index / total) * 2 * Math.PI + Math.PI / 6
    const distanceInDegrees = distance * 0.014
    return [
      center[0] + distanceInDegrees * Math.sin(angle),
      center[1] + distanceInDegrees * Math.cos(angle)
    ]
  }

  const handleMarkerClick = (competitor, isTarget = false) => {
    if (isTarget) {
      setIsTargetSelected(true)
      setSelectedCompetitor({ ...targetDealer })
    } else {
      setIsTargetSelected(false)
      setSelectedCompetitor(competitor)
      onSelectCompetitor?.(competitor)
    }
  }

  const closeModal = () => {
    setSelectedCompetitor(null)
    setIsTargetSelected(false)
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-xl"
        style={{ minHeight: '400px' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={zoom} />

        {/* Radius Circle */}
        <Circle
          center={center}
          radius={radiusInMeters}
          pathOptions={{
            color: '#3385ff',
            fillColor: '#3385ff',
            fillOpacity: 0.06,
            weight: 2,
            dashArray: '8, 8'
          }}
        />

        {/* Target Dealer Marker (You) */}
        <ClickableMarker 
          position={center} 
          icon={createNumberedIcon(1, true)}
          onClick={() => handleMarkerClick(targetDealer, true)}
        />

        {/* Competitor Markers */}
        {competitors.map((competitor, index) => {
          const position = getCompetitorPosition(
            index, 
            competitors.length, 
            competitor.distance_miles || 10
          )
          
          return (
            <ClickableMarker
              key={competitor.mc_dealer_id || index}
              position={position}
              icon={createNumberedIcon(competitor.competitor_rank || index + 1)}
              onClick={() => handleMarkerClick(competitor)}
            />
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 z-[1000]">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Legend</h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
              ★
            </div>
            <span className="text-xs text-gray-600 font-medium">You (Target)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <span className="text-xs text-gray-600">High Threat (1-3)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
              4
            </div>
            <span className="text-xs text-gray-600">Medium (4-6)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
              7
            </div>
            <span className="text-xs text-gray-600">Low Threat (7+)</span>
          </div>
        </div>
      </div>

      {/* Click instruction */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-100 z-[1000]">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-800">Click</span> any marker for details
        </p>
      </div>

      {/* Competitor Modal */}
      <CompetitorModal 
        competitor={selectedCompetitor}
        isOpen={!!selectedCompetitor}
        onClose={closeModal}
        isTarget={isTargetSelected}
      />
    </div>
  )
}

export default CompetitorMap
