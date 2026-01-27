import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  hint?: string
  variant?: 'default' | 'tracking' | 'empty'
}

export function EmptyState({
  icon,
  title,
  description,
  hint,
  variant = 'default',
}: EmptyStateProps) {
  const iconColor =
    variant === 'tracking'
      ? 'text-muted-foreground/40'
      : variant === 'empty'
      ? 'text-muted-foreground/30'
      : 'text-muted-foreground/50'

  const iconBg =
    variant === 'tracking'
      ? 'bg-muted/30'
      : variant === 'empty'
      ? 'bg-muted/20'
      : 'bg-muted/40'

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mb-3 transition-all duration-200 ease-out hover:scale-110`}>
          <div className={`h-6 w-6 ${iconColor} transition-opacity duration-200 flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      )}
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm mb-2">{description}</p>
      )}
      {hint && (
        <p className="text-xs text-muted-foreground/60 max-w-xs">{hint}</p>
      )}
    </div>
  )
}
