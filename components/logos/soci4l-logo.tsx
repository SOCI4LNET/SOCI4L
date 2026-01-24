import { cn } from '@/lib/utils'

interface Soci4LLogoProps {
  variant?: 'icon' | 'combination'
  className?: string
  width?: number
  height?: number
}

/**
 * SOCI4L Logo Component
 * 
 * Renders the SOCI4L logo with #f9f9f9 color (white)
 * Uses SVG files directly to avoid any path corruption
 * 
 * @param variant - 'icon' for icon only, 'combination' for logo + text
 * @param className - Additional CSS classes
 * @param width - Logo width (defaults based on variant)
 * @param height - Logo height (defaults based on variant)
 */
export function Soci4LLogo({ 
  variant = 'combination', 
  className = '',
  width,
  height 
}: Soci4LLogoProps) {
  const logoColor = '#f9f9f9'
  
  if (variant === 'icon') {
    // Icon SVG - directly from file, exact paths
    return (
      <svg
        id="katman_2"
        data-name="katman 2"
        viewBox="0 0 105.81 111.83"
        width={width}
        height={height}
        className={cn('flex-shrink-0', className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="katman_1" data-name="katman 1">
          <g>
            <path
              d="M49.89,81.2H0c9.23,18.18,28.11,30.63,49.89,30.63,30.88,0,55.92-25.04,55.92-55.92S80.77,0,49.89,0v30.63c13.96,0,25.28,11.32,25.28,25.28s-11.32,25.28-25.28,25.28Z"
              fill={logoColor}
            />
            <path
              d="M49.89,30.63v50.56c-13.97,0-25.28-11.32-25.28-25.28s11.31-25.28,25.28-25.28Z"
              fill={logoColor}
            />
          </g>
        </g>
      </svg>
    )
  }

  // Combination logo (icon + text) - directly from file, exact paths
  return (
    <svg
      id="katman_2"
      data-name="katman 2"
      viewBox="0 0 652.66 122.3"
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="katman_1" data-name="katman 1">
        <g>
          <g>
            <path
              d="M186.85,73.67c-14.73-2.76-19.17-5.06-19.17-11.51,0-5.21,4.29-9.81,14.26-9.81,9.36,0,15.34,5.06,16.72,12.27l18.26-.92c-2-14.11-11.97-27-35.13-27-21.63,0-32.68,11.2-32.68,25.46s7.98,21.02,32.37,25.77c15.03,2.92,17.8,5.07,17.8,10.44s-5.22,8.28-15.5,8.28c-11.04,0-16.72-4.91-18.41-12.73l-18.1.76c1.23,15.34,13.5,27.62,36.36,27.62,21.01,0,34.21-9.06,34.21-24.09,0-13.8-6.75-19.94-30.99-24.54Z"
              fill={logoColor}
            />
            <path
              d="M269.46,36.7c-23.16,0-38.35,16.72-38.35,42.8s15.19,42.8,38.35,42.8,38.35-16.73,38.35-42.8-15.34-42.8-38.35-42.8ZM269.46,106.04c-12.42,0-19.48-9.67-19.48-26.54s7.06-26.54,19.48-26.54,19.49,9.66,19.49,26.54-7.06,26.54-19.49,26.54Z"
              fill={logoColor}
            />
            <path
              d="M377.82,89.77c-2.15,10.74-9.05,16.27-18.1,16.27-12.73,0-20.25-10.13-20.25-26.54s7.52-26.54,20.25-26.54c8.89,0,15.49,5.52,17.64,15.19l17.15.02c-2.91-18.87-16.08-31.47-34.95-31.47-23.31,0-38.96,17.18-38.96,42.8s15.65,42.8,38.96,42.8c19.03,0,32.43-13.6,35.35-32.62l-17.09.09Z"
              fill={logoColor}
            />
            <path
              d="M437.09,10.47v17.18h18.4V10.47h-18.4ZM455.95,105.73V38.54h-47.86v14.73h29.76v52.46h-31.29v14.72h76.08v-14.72h-26.69Z"
              fill={logoColor}
            />
            <path
              d="M556.42,81.18V11.54h-21.32l-47.86,70.57v15.95h50.32v22.39h18.86v-22.39h13.04v-16.88h-13.04ZM537.56,81.18h-32.22l32.22-45.25v45.25Z"
              fill={logoColor}
            />
            <path
              d="M625.82,105.73v-54.53c0-16.72-8.44-25.31-25.16-25.31h-21.02v14.72h18.26c6.29,0,9.81,3.53,9.81,9.82v55.3h-31.14v14.72h76.09v-14.72h-26.84Z"
              fill={logoColor}
            />
          </g>
          <g>
            <path
              d="M54.57,88.8H0c10.09,19.88,30.74,33.5,54.57,33.5,33.77,0,61.15-27.38,61.15-61.15S88.34,0,54.57,0v33.5c15.27,0,27.65,12.38,27.65,27.65s-12.38,27.65-27.65,27.65Z"
              fill={logoColor}
            />
            <path
              d="M54.57,33.5v55.3c-15.28,0-27.65-12.38-27.65-27.65s12.37-27.65,27.65-27.65Z"
              fill={logoColor}
            />
          </g>
        </g>
      </g>
    </svg>
  )
}
