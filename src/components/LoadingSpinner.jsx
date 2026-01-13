import React from 'react'

export default function LoadingSpinner({ size = 'md', color = 'brand-green' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <div className={`w-full h-full border-2 border-gray-200 border-t-${color} rounded-full`}></div>
    </div>
  )
}