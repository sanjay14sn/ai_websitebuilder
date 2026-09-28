/** Public base URL for locally served uploads and live API endpoints (no trailing slash). */
export function getPublicBaseUrl() {
  if (
    process.env.PUBLIC_BASE_URL &&
    !process.env.PUBLIC_BASE_URL.includes('localhost') &&
    !process.env.PUBLIC_BASE_URL.includes('127.0.0.1')
  ) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  return 'https://api.gripforumglobal.com';
}

export function getLocalUploadsUrl(filename) {
  return `${getPublicBaseUrl()}/uploads/${filename}`;
}

