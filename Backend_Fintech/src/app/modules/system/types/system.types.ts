export type HealthState = 'healthy' | 'degraded' | 'unhealthy';

export type ComponentState = 'up' | 'down' | 'degraded' | 'unknown';



export interface SystemHealthResponse {

  status: HealthState;

  application: ComponentState;

  database: ComponentState;

  redis: ComponentState;

  aiProvider: ComponentState;

  uptimeSeconds: number;

  version: string;

  environment: string;

  timestamp: string;

}



export interface SystemReadinessResponse {

  ready: boolean;

  database: boolean;

  redis: boolean;

  ai: boolean;

  storage: boolean;

  queues: boolean;

  worker: boolean;

  dependencies: {

    database: ComponentState;

    redis: ComponentState;

    storage: ComponentState;

    queues: ComponentState;

    worker: ComponentState;

  };

  timestamp: string;

}



export interface SystemLivenessResponse {

  alive: boolean;

  uptimeSeconds: number;

  timestamp: string;

}



export interface SystemVersionResponse {

  version: string;

  build: string;

  commit: string;

  environment: string;

}

