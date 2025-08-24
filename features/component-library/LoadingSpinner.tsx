// features/component-library/LoadingSpinner.tsx
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
}

const LoadingSpinner = ({ size = 'medium', color = 'text-primary-600' }: SpinnerProps) => {
  const sizes = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4'
  }

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-t-transparent border-solid ${sizes[size]} ${color}`} />
    </div>
  )
}

export default LoadingSpinner
