/**
 * @file The single place in the frontend that calls `fetch`. Every page/
 * hook goes through the functions in `api/*.js`, which in turn go
 * through this client — components never call `fetch` directly.
 *
 * `credentials: 'include'` on every request is what makes session auth
 * work: the browser attaches the HttpOnly session cookie automatically,
 * and the frontend never touches a token itself (no localStorage,
 * no Authorization header to manage).
 */

/**
 * Thrown for any non-2xx response. Carries the backend's `{ message,
 * code, details? }` shape so callers can branch on `code` without
 * re-parsing the response.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {number} status
   * @param {Array<{ path: string, message: string }>} [details]
   */
  constructor(message, code, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {string} path e.g. '/api/auth/login'
 * @param {{ method?: string, body?: unknown }} [options]
 * @returns {Promise<any>} the parsed `data` payload (response body minus
 *   the `trackingHeaders` envelope field, which is transport metadata
 *   the UI never needs)
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? 'Something went wrong. Please try again.',
      payload?.code ?? 'UNKNOWN_ERROR',
      response.status,
      payload?.details,
    );
  }

  return payload;
}

export const apiClient = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

/**
 * Builds a `?a=1&b=2` query string, skipping undefined/null/empty values.
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
