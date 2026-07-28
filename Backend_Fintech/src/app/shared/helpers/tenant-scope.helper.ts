import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';
import { getOrganizationId } from '../context/org-context';
import { ForbiddenError, ValidationError } from '../exceptions/app.exception';

export function requireOrgId(): number {
  const orgId = getOrganizationId();
  if (!orgId) throw new ValidationError('Organization context is required');
  return orgId;
}

export async function assertMerchantInOrg(
  merchantId: number,
  orgId: number,
  pool: Pool = getPool(),
): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
    [merchantId, orgId],
  );
  if (!rows[0]) throw new ForbiddenError('Merchant does not belong to this organization');
}

export async function assertCustomerInOrg(
  customerId: number,
  orgId: number,
  pool: Pool = getPool(),
): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM customers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
    [customerId, orgId],
  );
  if (!rows[0]) throw new ForbiddenError('Customer does not belong to this organization');
}

export async function assertMerchantAndCustomerInOrg(
  merchantId: number,
  customerId: number | null | undefined,
  orgId: number,
  pool: Pool = getPool(),
): Promise<void> {
  await assertMerchantInOrg(merchantId, orgId, pool);
  if (customerId != null) await assertCustomerInOrg(customerId, orgId, pool);
}
