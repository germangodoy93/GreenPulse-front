import api from './axios';
import type { ThresholdConfig, SuccessResponse } from '../types';

export const getThresholds = (device_id: number) =>
  api.get<SuccessResponse<ThresholdConfig>>(`/thresholds/${device_id}`);

export const upsertThresholds = (device_id: number, data: Partial<Omit<ThresholdConfig, 'device_id' | 'updated_at'>>) =>
  api.put<SuccessResponse<ThresholdConfig>>(`/thresholds/${device_id}`, data);
