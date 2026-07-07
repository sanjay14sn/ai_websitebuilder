/** Public base URL for locally served uploads (no trailing slash). */
export function getPublicBaseUrl() {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  const port = process.env.PORT || 5001;
  return `http://localhost:${port}`;
}

export function getLocalUploadsUrl(filename) {
  return `${getPublicBaseUrl()}/uploads/${filename}`;
}
