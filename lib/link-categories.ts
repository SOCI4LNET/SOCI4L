export type LinkCategory = {
  id: string
  name: string
  order: number
}

export type StoredLinkCategoriesState = {
  version: 1
  updatedAt: string
  categories: LinkCategory[]
}

export const LINK_CATEGORIES_STORAGE_KEY = 'soci4l.linkCategories.v1'

