import axios from 'axios';
import { API } from '../config/api';

export interface AuthResult {
  token: string;
  email: string;
  role: 'Admin' | 'Viewer';
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string | string[];
}

function buildHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const response = await axios.post<AuthResult>(API.login, { email, password });
  return response.data as AuthResult;
}

export async function register(
  email: string,
  password: string,
  role: 'Admin' | 'Viewer'
): Promise<AuthResult> {
  const response = await axios.post<AuthResult>(
    API.register,
    { email, password, role },
    { headers: buildHeaders() }
  );

  return response.data;
}

export function logout(): void {
  localStorage.removeItem('ll_token');
  localStorage.removeItem('ll_user');
}

export function getToken(): string | null {
  return localStorage.getItem('ll_token');
}

export function getCurrentUser(): { id: string; email: string; role: string } | null {
  const token = getToken();
  const storedUser = localStorage.getItem('ll_user');

  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser) as { id: string; email: string; role: string };
      if (parsed.id && parsed.email && parsed.role) {
        return parsed;
      }
    } catch {
      // Ignore malformed local storage and fall back to the token payload.
    }
  }

  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadJson = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJson) as JwtPayload;
    const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const rawRole = (payload as Record<string, unknown>)[MS_ROLE_CLAIM] ?? payload.role;
const roleValue = Array.isArray(rawRole) ? rawRole[0] : rawRole as string | undefined;

    if (!payload.sub || !payload.email || !roleValue) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: roleValue
    };
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'Admin';
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const normalized = padded.padEnd(Math.ceil(padded.length / 4) * 4, '=');
  return atob(normalized);
}