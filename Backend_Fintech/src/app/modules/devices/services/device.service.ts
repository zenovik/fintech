import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { DeviceRepository, DeviceRow, DeviceListQuery } from '../repositories/device.repository';

function mapDevice(row: DeviceRow) {
  return {
    id: row.id, uuid: row.uuid, deviceRef: row.device_ref, serialNumber: row.serial_number,
    deviceId: row.device_id, deviceType: row.device_type, model: row.model, manufacturer: row.manufacturer,
    firmwareVersion: row.firmware_version, status: row.status, merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null, outletId: row.outlet_id, outletName: row.outlet_name ?? null,
    assignedUserId: row.assigned_user_id, assignedUserName: row.assigned_user_name ?? null,
    activatedAt: row.activated_at, lastSyncAt: row.last_sync_at, healthStatus: row.health_status,
    batteryPct: row.battery_pct, simNumber: row.sim_number, networkType: row.network_type,
    latitude: row.latitude, longitude: row.longitude, locationLabel: row.location_label,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export class DeviceService {
  constructor(private readonly repo = new DeviceRepository()) {}

  async list(query: DeviceListQuery) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapDevice),
      stats: {
        total: Number(stats.total ?? 0), active: Number(stats.active_count ?? 0),
        provisioned: Number(stats.provisioned_count ?? 0), unhealthy: Number(stats.unhealthy_count ?? 0),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Device not found');
    return mapDevice(row);
  }

  async provision(dto: { serialNumber: string; deviceId: string; deviceType: string; model?: string; manufacturer?: string; firmwareVersion?: string }, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.create(dto, orgId, actorId);
    void auditRecorder.record({ module: 'devices', categoryCode: 'operations', actionCode: 'device_provisioned', entityType: 'payment_device', entityId: String(id), description: `Provisioned device ${dto.serialNumber}`, userId: actorId }).catch(() => {});
    return this.getById(id);
  }

  async activate(id: number, dto: { merchantId: number; outletId?: number; assignedUserId?: number }, actorId?: number) {
    await this.requireDevice(id);
    await this.repo.updateStatus(id, 'active', { ...dto, activatedAt: new Date() }, actorId);
    void auditRecorder.record({ module: 'devices', categoryCode: 'operations', actionCode: 'device_activated', entityType: 'payment_device', entityId: String(id), description: `Activated device #${id}`, userId: actorId }).catch(() => {});
    if (actorId) void notificationDispatch.dispatch({ userId: actorId, eventCode: 'device_assigned', title: `Device activated`, body: `Device #${id} assigned to merchant`, relatedEntityType: 'payment_device', relatedEntityId: id }).catch(() => {});
    return this.getById(id);
  }

  async deactivate(id: number, actorId?: number) {
    await this.requireDevice(id);
    await this.repo.updateStatus(id, 'inactive', {}, actorId);
    return this.getById(id);
  }

  async transfer(id: number, dto: { merchantId: number; outletId?: number }, actorId?: number) {
    await this.requireDevice(id);
    await this.repo.updateStatus(id, 'active', dto, actorId);
    void auditRecorder.record({ module: 'devices', categoryCode: 'operations', actionCode: 'device_transferred', entityType: 'payment_device', entityId: String(id), description: `Transferred device #${id}`, userId: actorId, riskLevel: 'high' }).catch(() => {});
    return this.getById(id);
  }

  async replace(id: number, newDeviceId: number, actorId?: number) {
    await this.requireDevice(id);
    await this.repo.updateStatus(id, 'replaced', { replacedById: newDeviceId }, actorId);
    return this.getById(id);
  }

  async sync(id: number, dto: { batteryPct?: number; networkType?: string; firmwareVersion?: string; healthStatus?: string }) {
    await this.requireDevice(id);
    await this.repo.syncDevice(id, dto);
    return this.getById(id);
  }

  async inventory(query: DeviceListQuery) {
    const { items, total } = await this.repo.listInventory(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, inventoryRef: r.inventory_ref, serialNumber: r.serial_number,
        deviceType: r.device_type, model: r.model, manufacturer: r.manufacturer,
        warehouseCode: r.warehouse_code, status: r.status, deviceId: r.device_id,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  private async requireDevice(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Device not found');
    return row;
  }
}
