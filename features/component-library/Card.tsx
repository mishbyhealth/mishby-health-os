// features/component-library/Card.tsx
import { twMerge } from 'tailwind-merge'
import React from 'react'

interface CardProps {
  className?: string
  children: React.ReactNode
  hoverEffect?: boolean
  padding?: 'none' | 'small' | 'medium' | 'large'
}

const Card = ({ className = '', children, hoverEffect = false, padding = 'medium' }: CardProps) => {
  const paddings = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-4 md:p-6',
    large: 'p-6 md:p-8'
  }

  return (
    <div
      className={twMerge(
        'bg-white rounded-lg shadow',
        paddings[padding],
        hoverEffect && 'hover:shadow-md transition-shadow',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
