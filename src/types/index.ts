export interface Device {
  id: number;
  nombre: string;
  tipo_zona: 'interior' | 'exterior' | 'invernadero' | 'bodega';
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  created_at: string;
}

export interface DeviceWithKey extends Device {
  api_key: string;
}

export interface Reading {
  id: number;
  device_id: number;
  temperature: number | null;
  air_humidity: number | null;
  soil_humidity: number | null;
  pressure: number | null;
  altitude: number | null;
  light_lux: number | null;
  water_level: number | null;
  recorded_at: string;
  created_at: string;
}

export interface Alert {
  id: number;
  device_id: number;
  reading_id: number;
  field: string;
  value: number;
  threshold_min: number | null;
  threshold_max: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resuelta: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface ThresholdConfig {
  device_id: number;
  temperature_min: number | null;
  temperature_max: number | null;
  air_humidity_min: number | null;
  air_humidity_max: number | null;
  soil_humidity_min: number | null;
  soil_humidity_max: number | null;
  pressure_min: number | null;
  pressure_max: number | null;
  altitude_min: number | null;
  altitude_max: number | null;
  light_lux_min: number | null;
  light_lux_max: number | null;
  water_level_min: number | null;
  water_level_max: number | null;
  updated_at: string;
}

export interface AggregateResult {
  field: string;
  min: number | null;
  max: number | null;
  avg: number | null;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
  };
}

export interface SuccessResponse<T> {
  data: T;
  message: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ZoneType = 'interior' | 'exterior' | 'invernadero' | 'bodega';

export type SensorField =
  | 'temperature'
  | 'air_humidity'
  | 'soil_humidity'
  | 'pressure'
  | 'altitude'
  | 'light_lux'
  | 'water_level';
