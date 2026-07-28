export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  application: string;
  database: string;
  aiProvider: string;
  uptimeSeconds: number;
  version: string;
  environment: string;
  timestamp: string;
}

export interface SystemReadiness {
  ready: boolean;
  database: boolean;
  ai: boolean;
  storage: boolean;
  queues: boolean;
  timestamp: string;
}

export interface SystemVersion {
  version: string;
  build: string;
  commit: string;
  environment: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
}
