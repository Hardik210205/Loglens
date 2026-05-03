import axios from 'axios';
import { API } from '../config/api';
import { getToken } from './authApi';

export interface ServiceDto {
  id: string;
  name: string;
  displayName: string;
  createdAt: string;
  isActive: boolean;
  ownerEmail: string;
  keyPrefix: string;
}

export interface CreateServiceResult {
  serviceId: string;
  name: string;
  displayName: string;
  rawApiKey: string;
}

export interface ApiKeyResult {
  rawApiKey: string;
  keyPrefix: string;
  serviceId: string;
}

export interface UserDto {
  id: string;
  email: string;
  role: 'Admin' | 'Viewer';
  createdAt: string;
  isActive: boolean;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getServices(): Promise<ServiceDto[]> {
  const response = await axios.get<ServiceDto[]>(API.services, { headers: authHeaders() });
  return response.data;
}

export async function createService(name: string, displayName: string): Promise<CreateServiceResult> {
  const response = await axios.post<CreateServiceResult>(
    API.services,
    { name, displayName },
    { headers: authHeaders() }
  );

  return response.data;
}

export async function deleteService(id: string): Promise<void> {
  await axios.delete(API.deleteService(id), { headers: authHeaders() });
}

export async function rotateKey(id: string): Promise<ApiKeyResult> {
  const response = await axios.post<ApiKeyResult>(API.rotateKey(id), undefined, {
    headers: authHeaders()
  });

  return response.data;
}

export async function revealKey(id: string): Promise<ApiKeyResult> {
  const response = await axios.get<ApiKeyResult>(API.revealKey(id), {
    headers: authHeaders()
  });

  return response.data;
}

export async function getUsers(): Promise<UserDto[]> {
  const response = await axios.get<UserDto[]>(API.users, { headers: authHeaders() });
  return response.data;
}

export async function updateRole(id: string, role: 'Admin' | 'Viewer'): Promise<void> {
  await axios.patch(API.updateRole(id), { newRole: role }, { headers: authHeaders() });
}

export async function deactivateUser(id: string): Promise<void> {
  await axios.patch(API.deactivateUser(id), undefined, { headers: authHeaders() });
}