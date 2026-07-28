import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../../database';
import { getOrganizationId, appendMerchantOrgFilter } from '../../../shared/context/org-context';

export interface StageDefinition extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  sequence_order: number;
  sla_hours: number;
  required_role: string | null;
  is_skippable: number;
  is_terminal: number;
  maps_to_status: string;
}

export interface WorkflowInstanceRow extends RowDataPacket {
  id: number;
  uuid: string;
  application_id: number;
  current_stage_id: number;
  previous_stage_id: number | null;
  assigned_user_id: number | null;
  assigned_role_code: string | null;
  priority: string;
  workflow_status: string;
  sla_due_at: string | null;
  sla_breached: number;
  remarks: string | null;
  application_ref?: string;
  business_name?: string;
  organization_id?: number;
  organization_name?: string;
  stage_code?: string;
  stage_name?: string;
  assigned_user_name?: string;
}

export class WorkflowRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getStages(): Promise<StageDefinition[]> {
    const [rows] = await this.pool.query<StageDefinition[]>(
      'SELECT * FROM onboarding_workflow_stage_definitions WHERE is_active = 1 ORDER BY sequence_order',
    );
    return rows;
  }

  async getStageByCode(code: string): Promise<StageDefinition | null> {
    const [rows] = await this.pool.query<StageDefinition[]>(
      'SELECT * FROM onboarding_workflow_stage_definitions WHERE code = ? AND is_active = 1',
      [code],
    );
    return rows[0] ?? null;
  }

  async getStageById(id: number): Promise<StageDefinition | null> {
    const [rows] = await this.pool.query<StageDefinition[]>(
      'SELECT * FROM onboarding_workflow_stage_definitions WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  async getNextStage(currentStageId: number): Promise<StageDefinition | null> {
    const current = await this.getStageById(currentStageId);
    if (!current) return null;
    const [rows] = await this.pool.query<StageDefinition[]>(
      `SELECT * FROM onboarding_workflow_stage_definitions
       WHERE is_active = 1 AND sequence_order > ? AND is_terminal = 0 AND code NOT IN ('rejected','sent_back')
       ORDER BY sequence_order LIMIT 1`,
      [current.sequence_order],
    );
    return rows[0] ?? null;
  }

  async findInstanceByApplication(applicationId: number): Promise<WorkflowInstanceRow | null> {
    const [rows] = await this.pool.query<WorkflowInstanceRow[]>(
      `SELECT wi.*, sd.code AS stage_code, sd.name AS stage_name
       FROM onboarding_workflow_instances wi
       JOIN onboarding_workflow_stage_definitions sd ON sd.id = wi.current_stage_id
       WHERE wi.application_id = ?`,
      [applicationId],
    );
    return rows[0] ?? null;
  }

  async createInstance(applicationId: number, stageId: number, assignedUserId?: number, assignedRole?: string): Promise<number> {
    const stage = await this.getStageById(stageId);
    const slaDue = stage?.sla_hours
      ? new Date(Date.now() + stage.sla_hours * 3600000).toISOString().slice(0, 19).replace('T', ' ')
      : null;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO onboarding_workflow_instances
        (uuid, application_id, current_stage_id, assigned_user_id, assigned_role_code, workflow_status, sla_due_at, started_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [randomUUID(), applicationId, stageId, assignedUserId ?? null, assignedRole ?? stage?.required_role ?? null, slaDue],
    );
    return result.insertId;
  }

  async advanceStage(
    instanceId: number,
    nextStageId: number,
    opts: { assignedUserId?: number; assignedRole?: string; status?: string; remarks?: string },
  ): Promise<void> {
    const stage = await this.getStageById(nextStageId);
    const slaDue = stage?.sla_hours
      ? new Date(Date.now() + stage.sla_hours * 3600000).toISOString().slice(0, 19).replace('T', ' ')
      : null;
    await this.pool.query(
      `UPDATE onboarding_workflow_instances SET
        previous_stage_id = current_stage_id, current_stage_id = ?, assigned_user_id = ?,
        assigned_role_code = ?, workflow_status = ?, sla_due_at = ?, sla_breached = 0,
        remarks = COALESCE(?, remarks), started_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [nextStageId, opts.assignedUserId ?? null, opts.assignedRole ?? stage?.required_role ?? null,
        opts.status ?? 'in_progress', slaDue, opts.remarks ?? null, instanceId],
    );
  }

  async updateInstanceStatus(instanceId: number, status: string, completed = false): Promise<void> {
    await this.pool.query(
      `UPDATE onboarding_workflow_instances SET workflow_status = ?, completed_at = ${completed ? 'NOW()' : 'completed_at'}, updated_at = NOW() WHERE id = ?`,
      [status, instanceId],
    );
  }

  async addHistory(input: {
    applicationId: number; instanceId: number; stageId: number;
    previousStageId?: number; nextStageId?: number; decision: string;
    assignedUserId?: number; assignedRoleCode?: string; decidedBy?: number; remarks?: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO onboarding_workflow_stage_history
        (uuid, application_id, workflow_instance_id, stage_id, previous_stage_id, next_stage_id,
         decision, assigned_user_id, assigned_role_code, decided_by, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), input.applicationId, input.instanceId, input.stageId,
        input.previousStageId ?? null, input.nextStageId ?? null, input.decision,
        input.assignedUserId ?? null, input.assignedRoleCode ?? null, input.decidedBy ?? null, input.remarks ?? null],
    );
  }

  async listQueue(filters: {
    queue: 'pending' | 'assigned' | 'overdue' | 'completed';
    page: number; pageSize: number; search?: string; priority?: string;
    merchantId?: number; organizationId?: number; reviewerId?: number;
  }): Promise<{ items: WorkflowInstanceRow[]; total: number }> {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('a.organization_id = ?'); params.push(orgId); }
    if (filters.organizationId) { conditions.push('a.organization_id = ?'); params.push(filters.organizationId); }

    if (filters.queue === 'pending') conditions.push("wi.workflow_status IN ('pending','in_progress') AND wi.assigned_user_id IS NULL");
    else if (filters.queue === 'assigned') conditions.push("wi.workflow_status IN ('pending','in_progress') AND wi.assigned_user_id IS NOT NULL");
    else if (filters.queue === 'overdue') conditions.push("(wi.workflow_status = 'overdue' OR (wi.sla_due_at < NOW() AND wi.workflow_status NOT IN ('completed','rejected')))");
    else if (filters.queue === 'completed') conditions.push("wi.workflow_status IN ('completed','rejected')");

    if (filters.priority) { conditions.push('wi.priority = ?'); params.push(filters.priority); }
    if (filters.reviewerId) { conditions.push('wi.assigned_user_id = ?'); params.push(filters.reviewerId); }
    if (filters.search) {
      conditions.push('(a.application_ref LIKE ? OR b.business_name LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    const where = conditions.join(' AND ');
    const offset = (filters.page - 1) * filters.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM onboarding_workflow_instances wi
       JOIN merchant_onboarding_applications a ON a.id = wi.application_id
       LEFT JOIN merchant_onboarding_business b ON b.application_id = a.id
       WHERE ${where}`,
      params,
    );
    const [rows] = await this.pool.query<WorkflowInstanceRow[]>(
      `SELECT wi.*, a.application_ref, a.organization_id, b.business_name,
              org.display_name AS organization_name, sd.code AS stage_code, sd.name AS stage_name,
              CONCAT(u.first_name, ' ', u.last_name) AS assigned_user_name
       FROM onboarding_workflow_instances wi
       JOIN merchant_onboarding_applications a ON a.id = wi.application_id
       LEFT JOIN merchant_onboarding_business b ON b.application_id = a.id
       LEFT JOIN organizations org ON org.id = a.organization_id
       JOIN onboarding_workflow_stage_definitions sd ON sd.id = wi.current_stage_id
       LEFT JOIN users u ON u.id = wi.assigned_user_id
       WHERE ${where}
       ORDER BY wi.priority DESC, wi.sla_due_at ASC
       LIMIT ? OFFSET ?`,
      [...params, filters.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async bulkAssign(instanceIds: number[], userId: number, roleCode?: string): Promise<void> {
    if (!instanceIds.length) return;
    const placeholders = instanceIds.map(() => '?').join(',');
    await this.pool.query(
      `UPDATE onboarding_workflow_instances SET assigned_user_id = ?, assigned_role_code = COALESCE(?, assigned_role_code),
        workflow_status = 'in_progress', updated_at = NOW() WHERE id IN (${placeholders})`,
      [userId, roleCode ?? null, ...instanceIds],
    );
  }

  async getHistory(applicationId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT h.*, sd.name AS stage_name, ns.name AS next_stage_name,
              CONCAT(u.first_name, ' ', u.last_name) AS decided_by_name
       FROM onboarding_workflow_stage_history h
       JOIN onboarding_workflow_stage_definitions sd ON sd.id = h.stage_id
       LEFT JOIN onboarding_workflow_stage_definitions ns ON ns.id = h.next_stage_id
       LEFT JOIN users u ON u.id = h.decided_by
       WHERE h.application_id = ?
       ORDER BY h.decided_at DESC`,
      [applicationId],
    );
    return rows;
  }

  async getSla(applicationId: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT wi.sla_due_at, wi.sla_breached, wi.workflow_status, sd.name AS stage_name, sd.sla_hours,
              TIMESTAMPDIFF(HOUR, NOW(), wi.sla_due_at) AS remaining_hours
       FROM onboarding_workflow_instances wi
       JOIN onboarding_workflow_stage_definitions sd ON sd.id = wi.current_stage_id
       WHERE wi.application_id = ?`,
      [applicationId],
    );
    return rows[0] ?? null;
  }

  async getDashboardStats(orgId?: number): Promise<RowDataPacket> {
    const orgFilter = orgId ? 'AND a.organization_id = ?' : '';
    const params = orgId ? [orgId] : [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
        SUM(CASE WHEN sd.code = 'compliance_review' AND wi.workflow_status IN ('pending','in_progress','overdue') THEN 1 ELSE 0 END) AS pending_compliance,
        SUM(CASE WHEN sd.code = 'risk_review' AND wi.workflow_status IN ('pending','in_progress','overdue') THEN 1 ELSE 0 END) AS pending_risk,
        SUM(CASE WHEN sd.code IN ('compliance_review','risk_review','business_review') AND wi.workflow_status IN ('pending','in_progress') THEN 1 ELSE 0 END) AS pending_approvals,
        SUM(CASE WHEN sd.code = 'go_live' AND DATE(wi.started_at) = CURDATE() THEN 1 ELSE 0 END) AS go_live_today,
        SUM(CASE WHEN wi.sla_breached = 1 OR (wi.sla_due_at < NOW() AND wi.workflow_status NOT IN ('completed','rejected')) THEN 1 ELSE 0 END) AS sla_breaches,
        SUM(CASE WHEN wi.workflow_status = 'rejected' AND DATE(wi.updated_at) = CURDATE() THEN 1 ELSE 0 END) AS rejected_today
       FROM onboarding_workflow_instances wi
       JOIN merchant_onboarding_applications a ON a.id = wi.application_id
       JOIN onboarding_workflow_stage_definitions sd ON sd.id = wi.current_stage_id
       WHERE 1=1 ${orgFilter}`,
      params,
    );
    return rows[0] ?? {};
  }
}
