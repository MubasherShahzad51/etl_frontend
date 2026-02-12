const Card = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
        hoverable ? 'hover:shadow-md hover:border-gray-200 cursor-pointer transition-all' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
