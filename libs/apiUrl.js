/**
 * Helper to build API URLs that work in both server and client contexts.
 * On the server inside Docker, uses NEXT_API_URL env var.
 * In the browser or when env var isn't set, uses relative paths.
 */
export function buildApiUrl(path) {
  // Strip leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // When running server-side (e.g. in Next.js server components or API routes)
  if (typeof window === 'undefined' && process.env.NEXT_API_URL) {
    return `${process.env.NEXT_API_URL}/${cleanPath}`;
  }
  
  // When running in the browser or no NEXT_API_URL is set
  return `/${cleanPath}`;
}