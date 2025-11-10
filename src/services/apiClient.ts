import { apiConfig, appConfig } from '../config/appConfig';
import { secureStorage } from './secureStorage';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

type ApiError = Error & { status?: number; code?: string };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? appConfig.timeouts.api;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await secureStorage.getItem(appConfig.storage.keys.userToken);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 401) {
      // Manejo centralizado de sesión inválida/expirada: cerrar sesión y limpiar almacenamiento
      try {
        await signOut(auth);
      } catch {
        // Ignorar errores de signOut para evitar romper la app
      }
      await secureStorage.removeItem('user');
      await secureStorage.removeItem(appConfig.storage.keys.userToken);

      const unauthorizedError: ApiError = new Error('Unauthorized');
      unauthorizedError.status = 401;
      unauthorizedError.code = 'UNAUTHORIZED';
      throw unauthorizedError;
    }

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const httpError: ApiError = new Error(`HTTP ${response.status}: ${raw}`);
      httpError.status = response.status;
      throw httpError;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = { request };
export default apiClient;