// features/component-library/Button.tsx
import { twMerge } from 'tailwind-merge'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const base = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    outline: 'border border-gray-400 text-gray-800 hover:bg-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }

  const sizes = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-5 py-3 text-lg'
  }

  const merged = twMerge(
    base,
    variants[variant],
    sizes[size],
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  )

  return (
    <button className={merged} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button
