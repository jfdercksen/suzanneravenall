export interface BlogTag {
  tag: string
  id: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: unknown
  featuredImage?: {
    url: string
    alt?: string
    width?: number
    height?: number
  }
  author?: string
  publishedAt?: string
  isPublished: boolean
  seoTitle?: string
  seoDescription?: string
  tags?: BlogTag[]
}

export interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
