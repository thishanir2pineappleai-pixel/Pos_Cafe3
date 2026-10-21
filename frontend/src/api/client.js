// The one place that sends requests to the API Gateway. Returns the `data` of the backend's success body and throws an
// ApiError otherwise (including when the server cannot be reached or does not answer in time).
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './constants.js';
import { ApiError } from './errorHandler.js';

export async function request(method, path, { json, token, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { ...(json !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: json !== undefined ? JSON.stringify(json) : undefined,
      signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'The server could not be reached');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    throw new ApiError(res.status, body?.code ?? 'UNKNOWN_ERROR', body?.message ?? `Request failed (${res.status})`, body?.errors ?? []);
  }
  return body.data;
}
