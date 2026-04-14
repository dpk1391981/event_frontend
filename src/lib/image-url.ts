/**
 * Normalise image URLs returned by the backend.
 *
 * The backend stores images as either:
 *   • Absolute URLs  — https://res.cloudinary.com/...  → return as-is
 *   • Relative paths — /uploads/vendors/123.jpg        → prepend media base
 *
 * NEXT_PUBLIC_MEDIA_BASE_URL   Set this in production if the media server
 *                              differs from the API server.
 * NEXT_PUBLIC_API_URL          Used to derive the media base when the above
 *                              env var is not set.
 */

function deriveMediaBase(): string {
  // Explicit override wins
  const explicit = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // BFF style: "/bff/api/v1" — same-origin, use empty string so relative paths work as-is in browser
  if (apiUrl.startsWith('/')) return '';

  // Strip /api/v1 (and anything after) to get the server root
  return apiUrl.replace(/\/api\/v1.*$/, '');
}

const MEDIA_BASE = deriveMediaBase();

/**
 * Returns a fully-qualified URL suitable for use in <Image src=...>.
 * Returns undefined if the input is empty/null.
 */
export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  // Already absolute
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Same-origin relative (BFF production mode)
  if (!MEDIA_BASE) return path;
  // Relative path — prepend media base
  return `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Map an array of image paths to absolute URLs, filtering out empties.
 */
export function getImageUrls(paths: string[] | null | undefined): string[] {
  if (!paths) return [];
  return paths.map(getImageUrl).filter(Boolean) as string[];
}
