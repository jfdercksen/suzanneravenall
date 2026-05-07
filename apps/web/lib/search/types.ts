export interface ProductSearchHit {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  price_zar: number | null
  collection_title: string | null
  collection_handle: string | null
  category_names: string[]
  _formatted?: Partial<ProductSearchHit>
}

export interface TopicSearchHit {
  id: string
  title: string
  shortDescription: string
  corePrinciple: string
  url: string
  _formatted?: Partial<TopicSearchHit>
}

export type SearchIndex = 'products' | 'explore_topics'

export interface SearchResultItem {
  type: SearchIndex
  id: string
  title: string
  subtitle: string
  url: string
  thumbnail: string | null
  price_zar: number | null
}

export interface MeiliSearchHitsResponse<T> {
  hits: T[]
  estimatedTotalHits: number
  query: string
  processingTimeMs: number
}
