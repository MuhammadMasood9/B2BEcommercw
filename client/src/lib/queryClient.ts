import { QueryClient, QueryFunction } from "@tanstack/react-query";

const nativeFetch = globalThis.fetch.bind(globalThis);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const refreshRes = await nativeFetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (!refreshRes.ok) {
      clearTokens();
      return false;
    }

    const refreshData = await refreshRes.json();
    if (refreshData?.accessToken && refreshData?.refreshToken) {
      storeTokens(refreshData.accessToken, refreshData.refreshToken);
      return true;
    }

    clearTokens();
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearTokens();
    return false;
  }
}

export async function authorizedFetch(
  input: RequestInfo,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  let requestUrl: string;
  if (typeof input === 'string' || input instanceof URL) {
    requestUrl = input.toString();
  } else {
    requestUrl = input.url;
  }

  const isSameOrigin = (() => {
    try {
      const absoluteUrl = new URL(requestUrl, window.location.origin);
      return absoluteUrl.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  })();

  const accessToken = getStoredAccessToken();
  const headers = new Headers(init.headers || undefined);

  if (accessToken && isSameOrigin && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  };

  let response = await nativeFetch(input, requestInit);

  if (response.status !== 401 || !retry) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  // Retry request with new token
  const retryHeaders = new Headers(init.headers || undefined);
  const newAccessToken = getStoredAccessToken();
  if (newAccessToken && isSameOrigin) {
    retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
  }

  const retryInit: RequestInit = {
    ...init,
    headers: retryHeaders,
    credentials: init.credentials ?? 'include',
  };

  response = await nativeFetch(input, retryInit);
  return response;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const headers: HeadersInit = isFormData ? {} : { 'Content-Type': 'application/json' };

  const response = await authorizedFetch(url, {
    method,
    headers,
    body: isFormData ? (data as BodyInit) : data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(response);

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get access token from localStorage
    const res = await authorizedFetch(queryKey.join("/") as string);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
