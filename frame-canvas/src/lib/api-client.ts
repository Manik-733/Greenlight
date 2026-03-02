import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

const API_BASE = import.meta.env.VITE_API_URL || "/api/bmdb";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Create an API client instance with auth token and error handling
 * Call this hook in components to get typed fetch functions
 */
export function useApiClient() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const fetchJson = async <T>(
    url: string,
    options?: FetchOptions,
  ): Promise<T> => {
    const token = localStorage.getItem("greenlight_token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem("greenlight_token");
      await signOut();
      navigate("/login");
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  return {
    get: <T>(url: string) =>
      fetchJson<T>(`${API_BASE}${url}`, { method: "GET" }),
    post: <T>(url: string, body?: unknown) =>
      fetchJson<T>(`${API_BASE}${url}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),
    patch: <T>(url: string, body?: unknown) =>
      fetchJson<T>(`${API_BASE}${url}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      }),
    put: <T>(url: string, body?: unknown) =>
      fetchJson<T>(`${API_BASE}${url}`, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),
    delete: <T>(url: string) =>
      fetchJson<T>(`${API_BASE}${url}`, { method: "DELETE" }),
  };
}
