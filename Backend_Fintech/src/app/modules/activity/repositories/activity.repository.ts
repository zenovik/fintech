import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export interface ActivityItem {
  source: string;
  id: string;
  title: string;
  description: string;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  occurredAt: Date;
  metadata: Record<string, unknown> | null;
}

export class ActivityRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getTimeline(query: { page: number; pageSize: number; source?: string }): Promise<{ items: ActivityItem[]; total: number }> {
    const orgId = getOrganizationId();
    const limit = query.pageSize;
    const offset = (query.page - 1) * query.pageSize;
    const items: ActivityItem[] = [];

    if (!query.source || query.source === 'audit') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT al.uuid, al.description, al.entity_type, al.entity_id, al.created_at,
                CONCAT(u.first_name,' ',u.last_name) AS actor_name, aa.name AS action_name
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         LEFT JOIN audit_actions aa ON aa.code = al.action_code
         ORDER BY al.created_at DESC LIMIT ?`, [limit],
      );
      for (const r of rows) {
        items.push({
          source: 'audit', id: r.uuid, title: r.action_name ?? 'Audit Event', description: r.description,
          actorName: r.actor_name, entityType: r.entity_type, entityId: r.entity_id ? String(r.entity_id) : null,
          occurredAt: r.created_at, metadata: null,
        });
      }
    }

    if (!query.source || query.source === 'notification') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT n.uuid, n.title, n.body, n.created_at, n.related_entity_type, n.related_entity_id
         FROM notifications n WHERE n.user_id = (SELECT id FROM users WHERE id = n.user_id LIMIT 1)
         ORDER BY n.created_at DESC LIMIT ?`, [limit],
      );
      for (const r of rows) {
        items.push({
          source: 'notification', id: r.uuid, title: r.title, description: r.body,
          actorName: null, entityType: r.related_entity_type, entityId: r.related_entity_id ? String(r.related_entity_id) : null,
          occurredAt: r.created_at, metadata: null,
        });
      }
    }

    if (!query.source || query.source === 'dashboard') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT ae.uuid, ae.title, ae.description, ae.occurred_at, ae.merchant_id,
                CONCAT(u.first_name,' ',u.last_name) AS actor_name
         FROM activity_events ae LEFT JOIN users u ON u.id = ae.actor_user_id
         ORDER BY ae.occurred_at DESC LIMIT ?`, [limit],
      );
      for (const r of rows) {
        items.push({
          source: 'dashboard', id: r.uuid, title: r.title, description: r.description,
          actorName: r.actor_name, entityType: r.merchant_id ? 'merchant' : null,
          entityId: r.merchant_id ? String(r.merchant_id) : null, occurredAt: r.occurred_at, metadata: null,
        });
      }
    }

    if (!query.source || query.source === 'workflow') {
      const wfParams: unknown[] = [];
      let wfOrg = '';
      if (orgId) {
        wfOrg = ` AND a.organization_id = ?`;
        wfParams.push(orgId);
      }
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT h.uuid, h.decision, h.remarks, h.decided_at, h.application_id,
                CONCAT(u.first_name,' ',u.last_name) AS actor_name, s.name AS stage_name
         FROM onboarding_workflow_stage_history h
         JOIN merchant_onboarding_applications a ON a.id = h.application_id
         LEFT JOIN users u ON u.id = h.decided_by
         JOIN onboarding_workflow_stage_definitions s ON s.id = h.stage_id
         WHERE 1=1${wfOrg} ORDER BY h.decided_at DESC LIMIT ?`, [...wfParams, limit],
      );
      for (const r of rows) {
        items.push({
          source: 'workflow', id: r.uuid, title: `${r.stage_name}: ${r.decision}`, description: r.remarks ?? '',
          actorName: r.actor_name, entityType: 'application', entityId: String(r.application_id),
          occurredAt: r.decided_at, metadata: null,
        });
      }
    }

    if (!query.source || query.source === 'device') {
      const devParams: unknown[] = [];
      let devOrg = '';
      if (orgId) { devOrg = ' AND organization_id = ?'; devParams.push(orgId); }
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT uuid, device_ref, status, updated_at FROM payment_devices
         WHERE deleted_at IS NULL${devOrg} ORDER BY updated_at DESC LIMIT ?`, [...devParams, limit],
      );
      for (const r of rows) {
        items.push({
          source: 'device', id: r.uuid, title: `Device ${r.device_ref}`, description: `Status: ${r.status}`,
          actorName: null, entityType: 'device', entityId: r.device_ref, occurredAt: r.updated_at, metadata: null,
        });
      }
    }

    if (!query.source || query.source === 'settlement') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT uuid, settlement_ref, status, hold_status, updated_at FROM settlements
         WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT ?`, [limit],
      );
      for (const r of rows) {
        items.push({
          source: 'settlement', id: r.uuid, title: r.settlement_ref, description: `Status: ${r.status}, Hold: ${r.hold_status}`,
          actorName: null, entityType: 'settlement', entityId: r.settlement_ref, occurredAt: r.updated_at, metadata: null,
        });
      }
    }

    if (!query.source || query.source === 'risk') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT uuid, action_taken, evaluated_at, risk_rule_id FROM risk_rule_evaluations
         WHERE matched = 1 ORDER BY evaluated_at DESC LIMIT ?`, [limit],
      );
      for (const r of rows) {
        items.push({
          source: 'risk', id: r.uuid, title: 'Risk Rule Triggered', description: r.action_taken ?? 'alert',
          actorName: null, entityType: 'risk_rule', entityId: String(r.risk_rule_id), occurredAt: r.evaluated_at, metadata: null,
        });
      }
    }

    items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    const paged = items.slice(offset, offset + limit);
    return { items: paged, total: items.length };
  }
}
