import { ChevronRight } from 'lucide-react'

const TaskItem = ({ icon: Icon, title, description, actionText = 'AI reminder' }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors flex-shrink-0">
        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-sm text-gray-900">{title}</h5>
        <p className="text-xs text-gray-500 mt-1">{actionText}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
    </div>
  )
}

export default TaskItem
