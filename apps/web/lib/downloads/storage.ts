import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { logWarn } from '@/lib/log'

/**
 * Files sold as a download (the three guided audios, Shayna 9 Oct: Bringing
 * Your Energy Back, Energetic Alignment & Inner Neutrality, Relaxation &
 * Energy Reclamation). The current WooCommerce site delivered them as
 * downloadable products; the new shop had no delivery at all.
 *
 * The file lives in the private Supabase "downloads" bucket and the product
 * (or one of its variants) names it in metadata:
 *   download_file      path inside the bucket, e.g. audio/bringing-your-energy-back.mp3
 *   download_filename  optional file name the buyer sees; defaults to the path's last part
 *
 * The order confirmation email signs one link per file (30 days) and lists
 * them above the order summary.
 */

export const DOWNLOADS_BUCKET = 'downloads'
/** How long a signed download link works. The email says so. */
export const DOWNLOAD_LINK_TTL_SECONDS = 30 * 24 * 60 * 60
export const DOWNLOAD_LINK_TTL_LABEL = '30 days'

const PATH_RE = /^[a-zA-Z0-9][a-zA-Z0-9._ /-]{0,200}$/

export interface DownloadFile {
  /** What the buyer bought, shown on the button. */
  title: string
  /** Path inside the bucket. */
  path: string
  /** File name offered by the browser. */
  filename: string
}

export interface DownloadLink {
  title: string
  url: string
}

type Meta = Record<string, unknown> | null | undefined

export interface OrderItemLike {
  title?: string | null
  variant?: {
    metadata?: Meta
    product?: { title?: string | null; metadata?: Meta } | null
  } | null
}

function readString(meta: Meta, key: string): string | null {
  const v = meta?.[key]
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}

/** The download an order line delivers, or null when it is not a download. */
export function downloadFileOf(item: OrderItemLike): DownloadFile | null {
  const variantMeta = item.variant?.metadata
  const productMeta = item.variant?.product?.metadata
  const path = readString(variantMeta, 'download_file') ?? readString(productMeta, 'download_file')
  if (!path || !PATH_RE.test(path) || path.includes('..')) return null
  const filename =
    readString(variantMeta, 'download_filename') ??
    readString(productMeta, 'download_filename') ??
    path.split('/').pop() ??
    path
  const title = item.variant?.product?.title?.trim() || item.title?.trim() || filename
  return { title, path, filename }
}

/** Every distinct file the order delivers, in line order. */
export function downloadsForOrder(items: OrderItemLike[]): DownloadFile[] {
  const seen = new Set<string>()
  const out: DownloadFile[] = []
  for (const item of items) {
    const file = downloadFileOf(item)
    if (!file || seen.has(file.path)) continue
    seen.add(file.path)
    out.push(file)
  }
  return out
}

/** True when every line in the order is a download, so the email can say so. */
export function isDownloadOnlyOrder(items: OrderItemLike[]): boolean {
  return items.length > 0 && items.every((item) => downloadFileOf(item) !== null)
}

/**
 * Signed links for the files, one per file. A file that cannot be signed
 * (missing in the bucket, storage down) is left out and logged; the email
 * then still goes out with the rest and the "reply for a fresh link" line.
 */
export async function signDownloadUrls(files: DownloadFile[]): Promise<DownloadLink[]> {
  if (files.length === 0) return []
  const supabase = getServiceRoleClient()
  if (!supabase) {
    logWarn('[downloads] Supabase service role is not configured; no download links signed')
    return []
  }
  const links: DownloadLink[] = []
  for (const file of files) {
    try {
      const { data, error } = await supabase.storage
        .from(DOWNLOADS_BUCKET)
        .createSignedUrl(file.path, DOWNLOAD_LINK_TTL_SECONDS, { download: file.filename })
      if (error || !data?.signedUrl) {
        logWarn(`[downloads] could not sign ${file.path}: ${error?.message ?? 'no url returned'}`)
        continue
      }
      links.push({ title: file.title, url: data.signedUrl })
    } catch (err) {
      logWarn(`[downloads] could not sign ${file.path}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return links
}
