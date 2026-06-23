import api from './axios';
import type { Device, DeviceWithKey, PaginatedResponse, SuccessResponse } from '../types';

export const getDevices = (page = 1, page_size = 20, activo?: boolean) =>
  api.get<PaginatedResponse<Device>>('/devices', {
    params: { page, page_size, ...(activo !== undefined && { activo }) },
  });

export const getDevice = (id: number) =>
  api.get<SuccessResponse<Device>>(`/devices/${id}`);

export const createDevice = (data: {
  nombre: string;
  tipo_zona: string;
  latitud?: number | null;
  longitud?: number | null;
}) => api.post<SuccessResponse<DeviceWithKey>>('/devices', data);

export const updateDevice = (
  id: number,
  data: { nombre?: string; tipo_zona?: string; latitud?: number | null; longitud?: number | null }
) => api.put<SuccessResponse<Device>>(`/devices/${id}`, data);

export const deleteDevice = (id: number) => api.delete(`/devices/${id}`);

export const rotateApiKey = (id: number) =>
  api.post<SuccessResponse<{ api_key: string }>>(`/devices/${id}/rotate-key`);
