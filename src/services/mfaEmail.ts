import { apiConfig, appConfig } from '../config/appConfig';

interface SendOtpResponse {
  success: boolean;
  devHint?: string;
  error?: string;
}

export async function sendEmailOtp(email: string): Promise<SendOtpResponse> {
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
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.error || 'Error al enviar OTP' };
    }
    return { success: true, devHint: json?.devHint };
  } catch (e: any) {
    clearTimeout(timeoutId);
    return { success: false, error: e?.message || 'Error de red al enviar OTP' };
  }
}

export async function verifyEmailOtp(email: string, code: string): Promise<{ success: boolean; error?: string; }>{
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
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.error || 'Código inválido' };
    }
    return { success: true };
  } catch (e: any) {
    clearTimeout(timeoutId);
    return { success: false, error: e?.message || 'Error de red al verificar OTP' };
  }
}