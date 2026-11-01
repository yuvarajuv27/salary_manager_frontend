import type { ApiError422 } from "../types/api";

const defaultBaseUrl = "http://localhost:3000";

function apiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? defaultBaseUrl;
}

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = apiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(resolveUrl(path), {
    ...init,
    credentials: "include",
  });

  if (response.status === 401) {
    throw { status: 401 };
  }

  if (response.status === 422) {
    const body = (await response.json()) as { errors?: ApiError422["errors"] };
    throw { status: 422, errors: body.errors ?? body };
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}
