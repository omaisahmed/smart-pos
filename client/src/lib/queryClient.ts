import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from queryKey. Allow queryKey like ["/api/transactions", { limit: 5 }]
    // so the second element becomes query params.
    let url = '';
    if (Array.isArray(queryKey) && queryKey.length > 0) {
      const [first, second, ...rest] = queryKey;
      if (typeof first === 'string') {
        url = first;
      } else {
        url = String(first);
      }

      // if second is an object, treat as query params
      if (second && typeof second === 'object' && !Array.isArray(second)) {
        const params = new URLSearchParams(
          Object.entries(second as Record<string, any>).reduce((acc, [k, v]) => {
            if (v === undefined || v === null) return acc;
            acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>)
        ).toString();
        if (params) url += `?${params}`;
        // append any further string parts
        if (rest.length) {
          url += `/${rest.map(p => typeof p === 'string' ? p : String(p)).join('/')}`;
        }
      } else {
        // no params object, append remaining parts
        const remaining = [second, ...rest].filter(p => p !== undefined).map(p => typeof p === 'string' ? p : String(p));
        if (remaining.length) url = `${url}/${remaining.join('/')}`;
      }
    } else {
      url = String(queryKey);
    }

    const res = await fetch(url, {
      credentials: "include",
    });

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
