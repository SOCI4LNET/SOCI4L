/**
 * Layout spacing constants for consistent alignment across dashboard pages.
 * 
 * These values ensure that:
 * - Header/breadcrumb row and page content share the same horizontal padding
 * - Divider lines span correctly and align with content
 * - All pages maintain consistent visual alignment
 */

/**
 * Horizontal padding for dashboard shell (header, breadcrumb, content containers)
 * - Mobile: 1rem (16px)
 * - Desktop: 1.5rem (24px)
 */
export const PAGE_GUTTER = 'px-4 md:px-6'

/**
 * Maximum width for constrained content areas (Overview, Settings, Social)
 * - Provides readable line length (1100-1280px range) while maintaining full-width shell
 * - Set to 1200px for optimal readability
 */
export const CONTENT_MAX_WIDTH = 'max-w-[1200px]'

/**
 * Vertical padding for page content areas
 */
export const PAGE_PADDING_Y = 'py-6'
