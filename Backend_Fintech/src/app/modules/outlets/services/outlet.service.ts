import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { OutletRepository, OutletRow } from '../repositories/outlet.repository';
import { CreateOutletBodyDto, OutletListQueryDto, UpdateOutletBodyDto } from '../dto';

function mapOutlet(row: OutletRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    outletCode: row.outlet_code,
    outletName: row.outlet_name,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    organizationId: row.organization_id,
    organizationName: row.organization_name ?? null,
    branchType: row.branch_type,
    storeNumber: row.store_number,
    gstNumber: row.gst_number,
    phone: row.phone,
    email: row.email,
    status: row.status,
    openingDate: row.opening_date,
    timezone: row.timezone,
    currency: row.currency,
    isPrimary: Boolean(row.is_primary),
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    workingHours: row.working_hours ? JSON.parse(row.working_hours as string) : null,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    country: row.country,
    state: row.state,
    city: row.city,
    pincode: row.pincode,
    notes: row.notes,
    outletManagerId: row.outlet_manager_id,
    outletManagerName: row.manager_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class OutletService {
  constructor(private readonly repo = new OutletRepository()) {}

  async list(query: OutletListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapOutlet),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Outlet not found');
    return mapOutlet(row);
  }

  async create(dto: CreateOutletBodyDto, actorId?: number) {
    const orgId = getOrganizationId() ?? dto.organizationId;
    if (!orgId) throw new ValidationError('Organization context is required');
    const valid = await this.repo.merchantBelongsToOrg(dto.merchantId, orgId);
    if (!valid) throw new ValidationError('Merchant does not belong to this organization');

    const id = await this.repo.create({ ...dto, organizationId: orgId }, actorId);
    const outlet = await this.getById(id);

    void auditRecorder.record({
      module: 'outlets', categoryCode: 'merchants', actionCode: 'outlet_create',
      entityType: 'outlet', entityId: String(id),
      description: `Created outlet ${outlet.outletName}.`,
      afterValues: { outletCode: outlet.outletCode, merchantId: outlet.merchantId },
      riskLevel: 'low',
    }, { userId: actorId }).catch(() => {});

    if (actorId) {
      void notificationDispatch.dispatch({
        userId: actorId,
        eventCode: 'outlet_created',
        body: `Outlet ${outlet.outletName} (${outlet.outletCode}) has been created.`,
        category: 'merchant',
        actionUrl: `/outlets/${id}`,
        actionLabel: 'View Outlet',
        relatedEntityType: 'outlet',
        relatedEntityId: id,
      }).catch(() => {});
    }

    return outlet;
  }

  async update(id: number, dto: UpdateOutletBodyDto, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.update(id, dto, actorId);
    const after = await this.getById(id);

    void auditRecorder.record({
      module: 'outlets', categoryCode: 'merchants', actionCode: 'outlet_update',
      entityType: 'outlet', entityId: String(id),
      description: `Updated outlet ${after.outletName}.`,
      beforeValues: { status: before.status, outletName: before.outletName },
      afterValues: { status: after.status, outletName: after.outletName },
      riskLevel: 'low',
    }, { userId: actorId }).catch(() => {});

    return after;
  }

  async activate(id: number, actorId?: number) {
    await this.getById(id);
    await this.repo.updateStatus(id, 'active', actorId);
    return this.getById(id);
  }

  async deactivate(id: number, actorId?: number) {
    await this.getById(id);
    await this.repo.updateStatus(id, 'inactive', actorId);
    return this.getById(id);
  }
}
