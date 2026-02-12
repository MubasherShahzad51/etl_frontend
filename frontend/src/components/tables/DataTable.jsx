import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const DataTable = ({
  columns,
  data,
  sortable = true,
  paginated = true,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No data available',
  density = 'default',
  tableLayout = 'auto'
}) => {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (column) => {
    if (!sortable || column.sortable === false) return

    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column.key)
      setSortDirection('asc')
    }
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    
    if (aVal === bVal) return 0
    
    const comparison = aVal > bVal ? 1 : -1
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = paginated
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
      </div>
    )
  }

  const isCompact = density === 'compact'
  const isFixed = tableLayout === 'fixed'
  const headerCell = isCompact
    ? `px-2 py-1.5 text-[9.5px] font-bold text-gray-600 uppercase tracking-wide border-b border-gray-200${isFixed ? ' whitespace-normal break-words leading-tight' : ''}`
    : 'px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200'
  const bodyCell = isCompact
    ? `px-2 py-1.5 text-[10px] text-gray-700${isFixed ? ' truncate' : ''}`
    : 'px-6 py-4 text-sm text-gray-700'
  const iconSize = isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'
  const tableClass = `w-full ${isFixed ? 'table-fixed' : ''}`
  const scrollClass = isFixed ? 'overflow-x-hidden' : 'overflow-x-auto'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={scrollClass}>
        <table className={tableClass}>
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`${headerCell} ${
                    sortable && column.sortable !== false 
                      ? 'cursor-pointer hover:bg-gray-100 transition-colors select-none' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronUp className={`${iconSize} -mb-1 transition-colors ${
                          sortColumn === column.key && sortDirection === 'asc' 
                            ? 'text-primary-500' 
                            : 'text-gray-300'
                        }`} />
                        <ChevronDown className={`${iconSize} transition-colors ${
                          sortColumn === column.key && sortDirection === 'desc' 
                            ? 'text-primary-500' 
                            : 'text-gray-300'
                        }`} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`group transition-all duration-200 ${
                  onRowClick 
                    ? 'cursor-pointer hover:bg-primary-50/50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={column.key} 
                    className={`${bodyCell} ${
                      colIndex === 0 ? 'font-medium' : ''
                    }`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-gray-700">{Math.min(currentPage * pageSize, data.length)}</span> of{' '}
            <span className="font-semibold text-gray-700">{data.length}</span> results
          </p>
          
          <div className="flex items-center gap-1">
            {/* First page */}
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'hover:bg-white hover:shadow-sm text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            {/* Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Last page */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
