import { BaseGatewayAdapter } from './gateway.adapter';

/** Internal simulator — preserves existing payment engine behavior. */
export class InternalGatewayAdapter extends BaseGatewayAdapter {
  readonly providerCode = 'internal';
}
