const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const API = {
  login: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/api/auth/register`,
  services: `${BASE_URL}/api/services`,
  rotateKey: (id: string) => `${BASE_URL}/api/services/${id}/rotate`,
  revealKey: (id: string) => `${BASE_URL}/api/services/${id}/key`,
  deleteService: (id: string) => `${BASE_URL}/api/services/${id}`,
  users: `${BASE_URL}/api/users`,
  updateRole: (id: string) => `${BASE_URL}/api/users/${id}/role`,
  deactivateUser: (id: string) => `${BASE_URL}/api/users/${id}/deactivate`
};

export const apiBaseUrl = BASE_URL;