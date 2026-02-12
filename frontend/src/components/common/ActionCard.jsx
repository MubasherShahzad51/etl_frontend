import { ChevronRight } from 'lucide-react'

const ActionCard = ({ icon: Icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
          {Icon && <Icon className="w-5 h-5 text-purple-600" />}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>
    </button>
  )
}

export default ActionCard
