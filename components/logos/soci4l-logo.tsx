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
  const logoColor = 'var(--logo-color, #f9f9f9)'

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

  // Combination logo (icon + text) - using SVG from file
  return (
    <svg
      id="katman_2"
      data-name="katman 2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 664.39 196.3"
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
      fill="none"
    >
      <defs>
        <style>
          {`.cls-1 {
            font-family: GeistMono-SemiBold, 'Geist Mono';
            font-size: 157.17px;
            font-weight: 600;
            fill: ${logoColor};
          }
          .cls-2 {
            letter-spacing: -.06em;
          }
          .cls-3 {
            letter-spacing: -.03em;
          }
          .cls-4 {
            letter-spacing: -.02em;
          }
          .cls-5 {
            letter-spacing: -.05em;
          }
          .cls-6 {
            letter-spacing: -.05em;
          }`}
        </style>
      </defs>
      <g id="katman_1" data-name="katman 1">
        <g>
          <g>
            <path
              d="M52.03,104.95H0c9.62,18.96,29.31,31.94,52.03,31.94,32.2,0,58.31-26.11,58.31-58.31s-26.11-58.31-58.31-58.31v31.94c14.56,0,26.36,11.81,26.36,26.36s-11.81,26.36-26.36,26.36Z"
              fill={logoColor}
            />
            <path
              d="M52.03,52.22v52.73c-14.57,0-26.36-11.81-26.36-26.36s11.8-26.36,26.36-26.36Z"
              fill={logoColor}
            />
          </g>
          <text className="cls-1" transform="translate(130.11 134.38)">
            <tspan className="cls-3" x="0" y="0">S</tspan>
            <tspan className="cls-4" x="90.17" y="0">O</tspan>
            <tspan className="cls-2" x="181.89" y="0">C</tspan>
            <tspan className="cls-5" x="266.44" y="0">I</tspan>
            <tspan className="cls-6" x="353.05" y="0">4</tspan>
            <tspan x="439.98" y="0">L</tspan>
          </text>
        </g>
      </g>
    </svg>
  )
}
