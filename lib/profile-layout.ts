export type ProfileBlockKey = 'summary' | 'links' | 'activity' | 'assets'

export type BlockVariant = 'compact' | 'full' | 'hiddenAmounts'

export interface ProfileLayoutBlock {
  key: ProfileBlockKey
  enabled: boolean
  order: number // Deprecated: kept for backward compatibility, use row/col instead
  row?: number // Grid row position (0-based)
  col?: 0 | 1 // Grid column position (0 = left, 1 = right)
  span?: 'half' | 'full' // Span: 'half' = half width (6 cols), 'full' = full width (12 cols) (default: 'half')
  variant?: BlockVariant // Variant for activity/assets blocks
  // Optional per-block config reserved for future use
  config?: Record<string, unknown>
}

export interface ProfileLayoutConfig {
  blocks: ProfileLayoutBlock[]
  layoutVariant?: 'grid' | 'stack' // Deprecated: always use 'stack' now
  columns?: 2 | 3 // Deprecated: always single column now
}

type StoredProfileLayoutV2 = {
  version: 2
  updatedAt: string
  blocks: {
    id: ProfileBlockKey
    enabled: boolean
    config?: Record<string, unknown>
  }[]
}

const LAYOUT_STORAGE_KEY_PREFIX_V2 = 'soci4l.profileLayout.v2:'
const LEGACY_GLOBAL_LAYOUT_KEY_V2 = 'soci4l.profileLayout.v2'

const ALL_BLOCK_KEYS: ProfileBlockKey[] = ['summary', 'links', 'activity', 'assets']
const REQUIRED_BLOCK_KEYS: ProfileBlockKey[] = ['links', 'activity', 'assets'] // Summary is deprecated

/**
 * Heavy blocks classification:
 * - HARD_HEAVY: Badge + default full width + apply on safe mode
 * - SOFT_HEAVY: Badge only (no defaults, no auto-apply)
 */
const HARD_HEAVY_BLOCKS = new Set<ProfileBlockKey>(['assets'])
const SOFT_HEAVY_BLOCKS = new Set<ProfileBlockKey>(['activity', 'links'])

export type BlockRecommendation = {
  badge: boolean
  defaultSpan: 'full' | null
  applyOnSafeMode: boolean
}

/**
 * Get recommendation for a block type
 */
export function getRecommendation(type: ProfileBlockKey): BlockRecommendation {
  if (HARD_HEAVY_BLOCKS.has(type)) {
    return {
      badge: true,
      defaultSpan: 'full',
      applyOnSafeMode: true,
    }
  }
  if (SOFT_HEAVY_BLOCKS.has(type)) {
    return {
      badge: true,
      defaultSpan: null,
      applyOnSafeMode: false,
    }
  }
  return {
    badge: false,
    defaultSpan: null,
    applyOnSafeMode: false,
  }
}

/**
 * @deprecated Use getRecommendation instead
 * Check if a block type is considered "heavy" and should be recommended as full-width
 */
export function isHeavyBlock(type: ProfileBlockKey): boolean {
  return HARD_HEAVY_BLOCKS.has(type) || SOFT_HEAVY_BLOCKS.has(type)
}

/**
 * Migrate old order-based layout to grid-based layout
 * Maps order -> row = floor(i / 2), col = i % 2, span = 'half'
 */
function migrateOrderToGrid(blocks: ProfileLayoutBlock[]): ProfileLayoutBlock[] {
  return blocks.map((block, index) => {
    // If already has row/col, keep it
    if (typeof block.row === 'number' && typeof block.col === 'number') {
      return {
        ...block,
        span: block.span || 'half',
      }
    }
    
    // Migrate from order: row = floor(order / 2), col = order % 2
    const order = typeof block.order === 'number' ? block.order : index
    return {
      ...block,
      row: Math.floor(order / 2),
      col: (order % 2) as 0 | 1,
      span: block.span || 'half',
    }
  })
}

/**
 * Normalize grid positions to ensure compact layout:
 * - Sort enabled blocks by row then col
 * - Reassign rows sequentially (0..N) while keeping left-right placement
 * - Handle full-span blocks: they occupy a full row, next blocks start on next row
 * - Ensure no duplicate (row,col) collisions
 */
function normalizeGridPositions(blocks: ProfileLayoutBlock[]): ProfileLayoutBlock[] {
  // Separate enabled and disabled blocks
  const enabled = blocks.filter((b) => b.enabled)
  const disabled = blocks.filter((b) => !b.enabled)
  
  // Sort enabled blocks: first by row, then by col
  enabled.sort((a, b) => {
    const rowA = a.row ?? 0
    const rowB = b.row ?? 0
    if (rowA !== rowB) return rowA - rowB
    
    const colA = a.col ?? 0
    const colB = b.col ?? 0
    return colA - colB
  })
  
  // Normalize rows: reassign sequentially, handling full-span blocks
  const normalized: ProfileLayoutBlock[] = []
  let currentRow = 0
  let currentCol = 0
  
  for (const block of enabled) {
    const span = block.span || 'half'
    
    if (span === 'full') {
      // Full-span blocks occupy entire row
      normalized.push({
        ...block,
        row: currentRow,
        col: 0,
        span: 'full',
      })
      currentRow++
      currentCol = 0
    } else {
      // Single-span blocks
      if (currentCol >= 2) {
        // Move to next row if both columns are filled
        currentRow++
        currentCol = 0
      }
      
      normalized.push({
        ...block,
        row: currentRow,
        col: currentCol as 0 | 1,
        span: 'single',
      })
      
      currentCol++
      if (currentCol >= 2) {
        currentRow++
        currentCol = 0
      }
    }
  }
  
    // Add disabled blocks with their original positions (or defaults)
    for (const block of disabled) {
      normalized.push({
        ...block,
        row: block.row ?? 0,
        col: block.col ?? 0,
        span: block.span || 'half',
      })
    }
  
  return normalized
}

/**
 * Normalize layout config to ensure consistency:
 * - Migrates old order-based configs to grid-based (row/col)
 * - Ensures unique grid positions
 * - Fills missing blocks with defaults
 * - Removes unknown blocks safely
 * - Ensures required blocks exist
 * - Normalizes grid positions to be compact (no gaps)
 */
export function normalizeLayoutConfig(config: ProfileLayoutConfig): ProfileLayoutConfig {
  const byKey = new Map<ProfileBlockKey, ProfileLayoutBlock>()
  
  // Collect existing blocks
  for (const block of config.blocks || []) {
    if (!ALL_BLOCK_KEYS.includes(block.key)) continue // Remove unknown blocks
    // Apply recommended span ONLY for HARD_HEAVY blocks if span is undefined (non-destructive)
    const recommendation = getRecommendation(block.key)
    const recommendedSpan = !block.span && recommendation.defaultSpan ? recommendation.defaultSpan : (block.span || 'half')
    byKey.set(block.key, {
      ...block,
      order: typeof block.order === 'number' ? block.order : ALL_BLOCK_KEYS.indexOf(block.key),
      variant: block.variant || 'compact',
      span: recommendedSpan,
    })
  }

  // Ensure required blocks exist
  for (const key of REQUIRED_BLOCK_KEYS) {
    if (!byKey.has(key)) {
      const defaultOrder = ALL_BLOCK_KEYS.indexOf(key)
      // Apply recommended span ONLY for HARD_HEAVY blocks on creation
      const recommendation = getRecommendation(key)
      const recommendedSpan = recommendation.defaultSpan || 'half'
      byKey.set(key, {
        key,
        enabled: true,
        order: defaultOrder,
        row: Math.floor(defaultOrder / 2),
        col: (defaultOrder % 2) as 0 | 1,
        span: recommendedSpan,
        variant: 'compact',
      })
    }
  }

  // Build result array
  const result: ProfileLayoutBlock[] = []
  for (const key of ALL_BLOCK_KEYS) {
    const block = byKey.get(key)
    if (block) {
      result.push(block)
    }
  }

  // Migrate old order-based configs to grid
  const migrated = migrateOrderToGrid(result)

  // Normalize grid positions (compact layout, no gaps)
  const normalized = normalizeGridPositions(migrated)

  // Ensure order is set for backward compatibility (based on grid position)
  const withOrder = normalized.map((block) => {
      const row = block.row ?? 0
      const col = block.col ?? 0
      const span = block.span || 'half'
      // Calculate order: full-span blocks count as 2 positions
      const order = span === 'full' ? row * 2 : row * 2 + col
    return {
      ...block,
      order,
    }
  })

  return {
    layoutVariant: 'grid',
    columns: 2,
    blocks: withOrder,
  }
}

export function getDefaultProfileLayout(): ProfileLayoutConfig {
  // Default layout: Links, Activity, Assets (summary removed, header always shown)
  // Grid layout: Heavy blocks (links, activity, assets) default to full-width
  // Each heavy block gets its own row with full span
  // Default variant: compact for all
  return {
    layoutVariant: 'grid',
    columns: 2,
    blocks: [
      { key: 'links', enabled: true, order: 0, row: 0, col: 0, span: 'half', variant: 'compact' }, // SOFT_HEAVY: badge only
      { key: 'activity', enabled: true, order: 1, row: 0, col: 1, span: 'half', variant: 'compact' }, // SOFT_HEAVY: badge only
      { key: 'assets', enabled: true, order: 2, row: 1, col: 0, span: 'full', variant: 'compact' }, // HARD_HEAVY: badge + default full
      { key: 'summary', enabled: false, order: 3, row: 2, col: 0, span: 'half', variant: 'compact' }, // Summary deprecated, keep for migration
    ],
  }
}

// normalizeBlocks is deprecated, use normalizeLayoutConfig instead

export function loadProfileLayout(profileId: string | null | undefined): ProfileLayoutConfig {
  if (!profileId) return getDefaultProfileLayout()
  if (typeof window === 'undefined') return getDefaultProfileLayout()

  const key = `${LAYOUT_STORAGE_KEY_PREFIX_V2}${profileId.toLowerCase()}`

  try {
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileLayoutConfig> | null
      if (parsed && Array.isArray(parsed.blocks)) {
        return normalizeLayoutConfig({
          layoutVariant: parsed.layoutVariant ?? 'stack',
          columns: parsed.columns ?? 1,
          blocks: parsed.blocks as ProfileLayoutBlock[],
        })
      }
    }

    // Legacy fallback: global v2 layout without per-profile scoping
    const legacyRaw = window.localStorage.getItem(LEGACY_GLOBAL_LAYOUT_KEY_V2)
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as Partial<StoredProfileLayoutV2> | null
      if (
        legacyParsed &&
        legacyParsed.version === 2 &&
        Array.isArray(legacyParsed.blocks)
      ) {
        const legacyBlocks: ProfileLayoutBlock[] = legacyParsed.blocks.map(
          (block, index) => ({
            key: block.id,
            enabled: block.enabled ?? true,
            order: index,
            variant: 'compact',
            config: block.config,
          })
        )

        return normalizeLayoutConfig({
          layoutVariant: 'stack',
          columns: 1,
          blocks: legacyBlocks,
        })
      }
    }
  } catch (error) {
    console.error('[profile-layout] Failed to load profile layout from localStorage', error)
  }

  return getDefaultProfileLayout()
}

export function saveProfileLayout(
  profileId: string | null | undefined,
  config: ProfileLayoutConfig
): void {
  if (!profileId) return
  if (typeof window === 'undefined') return

  try {
    const key = `${LAYOUT_STORAGE_KEY_PREFIX_V2}${profileId.toLowerCase()}`
    // Normalize config before saving to ensure consistency
    const normalized = normalizeLayoutConfig(config)
    const payload: ProfileLayoutConfig = {
      layoutVariant: normalized.layoutVariant ?? 'grid',
      columns: normalized.columns ?? 2,
      blocks: normalized.blocks,
    }
    window.localStorage.setItem(key, JSON.stringify(payload))
  } catch (error) {
    console.error('[profile-layout] Failed to save profile layout to localStorage', error)
  }
}

export type ProfilePreset = 'links_only' | 'minimal' | 'full' | 'privacy_first'

/**
 * Pure function: Apply preset to config and return normalized result
 * This is the single source of truth for preset definitions
 */
export function applyPreset(
  config: ProfileLayoutConfig,
  preset: ProfilePreset
): ProfileLayoutConfig {
  // Normalize input config first
  const normalized = normalizeLayoutConfig(config)
  const byKey = new Map<ProfileBlockKey, ProfileLayoutBlock>()
  for (const block of normalized.blocks) {
    byKey.set(block.key, block)
  }

  // Ensure all required blocks exist
  for (const key of REQUIRED_BLOCK_KEYS) {
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        enabled: true,
        order: ALL_BLOCK_KEYS.indexOf(key),
        variant: 'compact',
      })
    }
  }

  let nextBlocks: ProfileLayoutBlock[]

  switch (preset) {
    case 'links_only':
      // Links Only: links=true, activity=false, assets=false, links first
      nextBlocks = [
        { ...byKey.get('links')!, enabled: true, order: 0, row: 0, col: 0, span: 'half', variant: 'compact' },
        { ...byKey.get('activity')!, enabled: false, order: 1, row: 0, col: 1, span: 'half', variant: 'compact' },
        { ...byKey.get('assets')!, enabled: false, order: 2, row: 1, col: 0, span: 'half', variant: 'compact' },
        { ...byKey.get('summary')!, enabled: false, order: 3, row: 2, col: 0, span: 'half', variant: 'compact' },
      ]
      break

    case 'minimal':
      // Minimal: links=true, activity=true (compact), assets=false
      // Show only links and minimal activity, hide assets for a cleaner look
      nextBlocks = [
        { ...byKey.get('links')!, enabled: true, order: 0, row: 0, col: 0, span: 'half', variant: 'compact' },
        { ...byKey.get('activity')!, enabled: true, order: 1, row: 0, col: 1, span: 'half', variant: 'compact' },
        { ...byKey.get('assets')!, enabled: false, order: 2, row: 1, col: 0, span: 'half', variant: 'compact' },
        { ...byKey.get('summary')!, enabled: false, order: 3, row: 2, col: 0, span: 'single', variant: 'compact' },
      ]
      break

    case 'full':
      // Full Profile: links=true, activity=true, assets=true, compact variants
      nextBlocks = [
        { ...byKey.get('links')!, enabled: true, order: 0, row: 0, col: 0, span: 'single', variant: 'compact' },
        { ...byKey.get('activity')!, enabled: true, order: 1, row: 0, col: 1, span: 'single', variant: 'compact' },
        { ...byKey.get('assets')!, enabled: true, order: 2, row: 1, col: 0, span: 'single', variant: 'compact' },
        { ...byKey.get('summary')!, enabled: false, order: 3, row: 2, col: 0, span: 'single', variant: 'compact' },
      ]
      break

    case 'privacy_first':
      // Privacy-first: links=true, activity=true (hiddenAmounts), assets=true (hiddenAmounts)
      nextBlocks = [
        { ...byKey.get('links')!, enabled: true, order: 0, row: 0, col: 0, span: 'half', variant: 'compact' },
        { ...byKey.get('activity')!, enabled: true, order: 1, row: 0, col: 1, span: 'half', variant: 'hiddenAmounts' },
        { ...byKey.get('assets')!, enabled: true, order: 2, row: 1, col: 0, span: 'half', variant: 'hiddenAmounts' },
        { ...byKey.get('summary')!, enabled: false, order: 3, row: 2, col: 0, span: 'single', variant: 'compact' },
      ]
      break

    default:
      return normalized
  }

  // Return normalized result (will normalize grid positions)
  return normalizeLayoutConfig({
    layoutVariant: 'grid',
    columns: 2,
    blocks: nextBlocks,
  })
}

/**
 * Detect which preset matches the current config (or 'custom' if none matches)
 */
export function detectPreset(config: ProfileLayoutConfig): ProfilePreset | 'custom' {
  const normalized = normalizeLayoutConfig(config)
  const byKey = new Map<ProfileBlockKey, ProfileLayoutBlock>()
  for (const block of normalized.blocks) {
    byKey.set(block.key, block)
  }

  const links = byKey.get('links')
  const activity = byKey.get('activity')
  const assets = byKey.get('assets')

  if (!links || !activity || !assets) return 'custom'

  // Links Only: links=true, activity=false, assets=false
  if (links.enabled && !activity.enabled && !assets.enabled) {
    return 'links_only'
  }

  // Minimal: links=true, activity=true, assets=false
  if (links.enabled && activity.enabled && !assets.enabled) {
    return 'minimal'
  }

  // Full: links=true, activity=true, assets=true, all compact
  if (
    links.enabled &&
    activity.enabled &&
    assets.enabled &&
    activity.variant === 'compact' &&
    assets.variant === 'compact'
  ) {
    return 'full'
  }

  // Privacy-first: links=true, activity=true (hiddenAmounts), assets=true (hiddenAmounts)
  if (
    links.enabled &&
    activity.enabled &&
    assets.enabled &&
    activity.variant === 'hiddenAmounts' &&
    assets.variant === 'hiddenAmounts'
  ) {
    return 'privacy_first'
  }

  return 'custom'
}

/**
 * Dev utility: Verify preset application rules.
 * Call this in browser console: window.__verifyPresets?.()
 */
if (typeof window !== 'undefined') {
  ;(window as any).__verifyPresets = () => {
    const defaultConfig = getDefaultProfileLayout()
    const presets: ProfilePreset[] = ['links_only', 'minimal', 'full', 'privacy_first']

    console.group('[profile-layout] Preset verification')
    for (const preset of presets) {
      const result = applyPreset(defaultConfig, preset)
      const enabled = result.blocks.filter((b) => b.enabled).map((b) => b.key)
      const order = result.blocks.map((b) => `${b.key}:${b.order}`).join(', ')
      const variants = result.blocks
        .filter((b) => b.variant)
        .map((b) => `${b.key}:${b.variant}`)
        .join(', ')
      const detected = detectPreset(result)

      console.log(`\n${preset}:`, {
        enabled,
        order,
        variants: variants || 'none',
        detected,
        allNormalized: result.blocks.length >= 3,
      })
    }
    console.groupEnd()
  }
}

