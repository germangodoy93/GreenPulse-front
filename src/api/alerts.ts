import api from './axios';
import type { Alert, PaginatedResponse, SuccessResponse } from '../types';

export const getAlerts = (params?: {
  device_id?: number;
  resuelta?: boolean;
  severity?: string;
  page?: number;
  page_size?: number;
}) => api.get<PaginatedResponse<Alert>>('/alerts', { params });

export const resolveAlert = (id: number) =>
  api.patch<SuccessResponse<Alert>>(`/alerts/${id}/resolve`);
