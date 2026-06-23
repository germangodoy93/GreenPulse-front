import api from './axios';
import type { Reading, AggregateResult, PaginatedResponse, SuccessResponse } from '../types';

export const getReadings = (
  params?: { device_id?: number; page?: number; page_size?: number; from?: string; to?: string }
) =>
  api.get<PaginatedResponse<Reading>>('/readings', { params });

export const getLatestReading = (device_id: number) =>
  api.get<SuccessResponse<Reading>>('/readings/latest', { params: { device_id } });

export const getAggregate = (
  device_id: number,
  field: string,
  from?: string,
  to?: string
) =>
  api.get<SuccessResponse<AggregateResult>>('/readings/aggregate', {
    params: { device_id, field, from, to },
  });
