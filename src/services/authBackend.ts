import { apiConfig, appConfig } from '../config/appConfig';
import apiClient from './apiClient';
import { secureStorage } from './secureStorage';

export async function sendOtp(email: string): Promise<{ success: boolean; devHint?: string; error?: string }>{
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), appConfig.timeouts.api);
  try {
    const res = await fetch(`${apiConfig.baseUrl}/auth/email-otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json?.error || 'Error al enviar OTP' };
    }
    return { success: true, devHint: json?.devHint };
  } catch (e: any) {
    clearTimeout(timeoutId);
    return { success: false, error: e?.message || 'Error de red al enviar OTP' };
  }
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ success: boolean; token?: string; error?: string }>{
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), appConfig.timeouts.api);
  try {
    const res = await fetch(`${apiConfig.baseUrl}/auth/email-otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json?.error || 'Código inválido' };
    }
    const token: string | undefined = json?.token || json?.sessionToken || json?.data?.token;
    if (token) {
      await secureStorage.setItem(appConfig.storage.keys.userToken, token);
    }
    return { success: true, token };
  } catch (e: any) {
    clearTimeout(timeoutId);
    return { success: false, error: e?.message || 'Error de red al verificar OTP' };
  }
}

export async function getSessionToken(): Promise<string | null> {
  return secureStorage.getItem(appConfig.storage.keys.userToken);
}

export async function validateSession(): Promise<{ valid: boolean; email?: string; exp?: number }>{
  try {
    const res = await apiClient.request<{ valid: boolean; email?: string; exp?: number }>(
      '/auth/session/validate',
      { method: 'GET' }
    );
    return res;
  } catch (err: any) {
    return { valid: false };
  }
}

export async function logoutSession(): Promise<boolean> {
  try {
    await apiClient.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignorar errores y continuar limpiando el token
  }
  await secureStorage.removeItem(appConfig.storage.keys.userToken);
  return true;
}

export default {
  sendOtp,
  verifyOtp,
  getSessionToken,
  validateSession,
  logoutSession,
};