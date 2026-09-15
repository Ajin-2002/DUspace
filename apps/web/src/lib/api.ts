export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (apiBaseUrl) {
    return `${apiBaseUrl}${normalizedPath}`;
  }

  return normalizedPath;
}
