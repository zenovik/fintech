export type GatewayOperation = 'authorize' | 'capture' | 'refund' | 'void' | 'tokenize';

export interface GatewayRequest {
  operation: GatewayOperation;
  amount: number;
  currency: string;
  paymentIntentId?: number;
  externalId?: string;
  token?: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayResponse {
  success: boolean;
  externalId?: string;
  status: 'pending' | 'succeeded' | 'failed';
  acquirerReference?: string;
  rrn?: string;
  errorMessage?: string;
  raw?: Record<string, unknown>;
}

export interface PaymentGatewayAdapter {
  readonly providerCode: string;
  authorize(req: GatewayRequest): Promise<GatewayResponse>;
  capture(req: GatewayRequest): Promise<GatewayResponse>;
  refund(req: GatewayRequest): Promise<GatewayResponse>;
  void(req: GatewayRequest): Promise<GatewayResponse>;
  tokenize?(req: GatewayRequest): Promise<GatewayResponse>;
  verifyWebhook?(payload: string, signature: string, secret: string): boolean;
}

export abstract class BaseGatewayAdapter implements PaymentGatewayAdapter {
  abstract readonly providerCode: string;

  protected buildSuccess(req: GatewayRequest, externalId: string): GatewayResponse {
    return {
      success: true,
      externalId,
      status: 'succeeded',
      acquirerReference: `ACQ-${externalId.slice(0, 12)}`,
      rrn: `RRN${Date.now().toString().slice(-10)}`,
      raw: { provider: this.providerCode, operation: req.operation },
    };
  }

  protected buildFailure(message: string): GatewayResponse {
    return { success: false, status: 'failed', errorMessage: message };
  }

  async authorize(req: GatewayRequest): Promise<GatewayResponse> {
    return this.buildSuccess(req, `${this.providerCode}_auth_${Date.now()}`);
  }

  async capture(req: GatewayRequest): Promise<GatewayResponse> {
    return this.buildSuccess(req, req.externalId ?? `${this.providerCode}_cap_${Date.now()}`);
  }

  async refund(req: GatewayRequest): Promise<GatewayResponse> {
    return this.buildSuccess(req, `${this.providerCode}_ref_${Date.now()}`);
  }

  async void(req: GatewayRequest): Promise<GatewayResponse> {
    return this.buildSuccess(req, req.externalId ?? `${this.providerCode}_void_${Date.now()}`);
  }

  async tokenize(req: GatewayRequest): Promise<GatewayResponse> {
    return this.buildSuccess(req, `tok_${this.providerCode}_${Date.now()}`);
  }
}
