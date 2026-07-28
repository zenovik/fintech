import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { MerchantOnboardingRepository } from '../../merchant-onboarding/repositories/merchant-onboarding.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { RiskReviewRepository, KycReviewRepository } from '../repositories/approval.repository';
import { GoLivePromotionService } from './go-live-promotion.service';
import { StatusSyncService } from './status-sync.service';
import {
  BulkAssignBodyDto, ComplianceQueueQueryDto, DecisionBodyDto, ReassignBodyDto,
  RiskReviewBodyDto, KycDecisionBodyDto,
} from '../dto';

export class WorkflowService {
  constructor(
    private readonly repo = new WorkflowRepository(),
    private readonly onboardingRepo = new MerchantOnboardingRepository(),
    private readonly riskRepo = new RiskReviewRepository(),
    private readonly kycRepo = new KycReviewRepository(),
    private readonly goLiveService = new GoLivePromotionService(),
    private readonly statusSync = new StatusSyncService(),
  ) {}

  async getStages() {
    const stages = await this.repo.getStages();
    return stages.map((s) => ({
      id: s.id, code: s.code, name: s.name, sequenceOrder: s.sequence_order,
      slaHours: s.sla_hours, requiredRole: s.required_role, isSkippable: Boolean(s.is_skippable),
      isTerminal: Boolean(s.is_terminal), mapsToStatus: s.maps_to_status,
    }));
  }

  async getWorkflow(applicationId: number) {
    await this.requireApp(applicationId);
    const instance = await this.repo.findInstanceByApplication(applicationId);
    const history = await this.repo.getHistory(applicationId);
    const sla = await this.repo.getSla(applicationId);
    return {
      instance: instance ? this.mapInstance(instance) : null,
      history: history.map((h) => ({
        id: h.id, stageName: h.stage_name, nextStageName: h.next_stage_name,
        decision: h.decision, remarks: h.remarks, decidedByName: h.decided_by_name, decidedAt: h.decided_at,
      })),
      sla: sla ? {
        stageName: sla.stage_name, slaDueAt: sla.sla_due_at, slaBreached: Boolean(sla.sla_breached),
        remainingHours: sla.remaining_hours != null ? Number(sla.remaining_hours) : null,
        workflowStatus: sla.workflow_status,
      } : null,
    };
  }

  async startWorkflow(applicationId: number, actorId?: number) {
    const app = await this.requireApp(applicationId);
    const existing = await this.repo.findInstanceByApplication(applicationId);
    if (existing) return this.getWorkflow(applicationId);

    const submittedStage = await this.repo.getStageByCode('submitted');
    if (!submittedStage) throw new ValidationError('Workflow not configured');
    const complianceStage = await this.repo.getStageByCode('compliance_review');

    const instanceId = await this.repo.createInstance(applicationId, submittedStage.id, actorId);
    await this.repo.addHistory({
      applicationId, instanceId, stageId: submittedStage.id, decision: 'submitted', decidedBy: actorId,
      remarks: `Application ${app.application_ref} submitted`,
    });

    if (complianceStage) {
      await this.repo.advanceStage(instanceId, complianceStage.id, { status: 'pending' });
      await this.statusSync.syncOnboardingStatus(applicationId, complianceStage.maps_to_status, actorId);
      await this.repo.addHistory({
        applicationId, instanceId, stageId: complianceStage.id,
        previousStageId: submittedStage.id, decision: 'assigned', decidedBy: actorId,
        remarks: 'Moved to compliance review',
      });
    }

    await this.onboardingRepo.addTimeline(applicationId, 'submitted', 'Application submitted for approval workflow', actorId);
    return this.getWorkflow(applicationId);
  }

  async approve(applicationId: number, dto: DecisionBodyDto, actorId?: number) {
    return this.transition(applicationId, 'approve', dto, actorId);
  }

  async reject(applicationId: number, dto: DecisionBodyDto, actorId?: number) {
    return this.transition(applicationId, 'reject', dto, actorId);
  }

  async sendBack(applicationId: number, dto: DecisionBodyDto, actorId?: number) {
    const sentBackStage = await this.repo.getStageByCode('sent_back');
    if (!sentBackStage) throw new ValidationError('Sent back stage not configured');
    const instance = await this.requireInstance(applicationId);
    await this.repo.advanceStage(instance.id, sentBackStage.id, { status: 'sent_back', remarks: dto.remarks });
    await this.statusSync.syncOnboardingStatus(applicationId, sentBackStage.maps_to_status, actorId);
    await this.repo.addHistory({
      applicationId, instanceId: instance.id, stageId: sentBackStage.id,
      previousStageId: instance.current_stage_id, decision: 'send_back', decidedBy: actorId, remarks: dto.remarks,
    });
    void this.notify(actorId, 'onboarding_sent_back', applicationId, dto.remarks);
    void auditRecorder.record({
      module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'workflow_send_back',
      entityType: 'merchant_onboarding', entityId: String(applicationId),
      description: dto.remarks ?? 'Application sent back', riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getWorkflow(applicationId);
  }

  async reassign(applicationId: number, dto: ReassignBodyDto, actorId?: number) {
    const instance = await this.requireInstance(applicationId);
    await this.repo.bulkAssign([instance.id], dto.userId, dto.roleCode);
    await this.repo.addHistory({
      applicationId, instanceId: instance.id, stageId: instance.current_stage_id,
      decision: 'reassign', assignedUserId: dto.userId, assignedRoleCode: dto.roleCode,
      decidedBy: actorId, remarks: dto.remarks,
    });
    void notificationDispatch.dispatch({
      userId: dto.userId, eventCode: 'onboarding_assigned',
      body: `You have been assigned onboarding application #${applicationId}.`,
      category: 'merchant', relatedEntityType: 'merchant_onboarding', relatedEntityId: applicationId,
    }).catch(() => {});
    return this.getWorkflow(applicationId);
  }

  private async poolFixReassign(instanceId: number, userId: number, roleCode?: string) {
    await this.repo.bulkAssign([instanceId], userId, roleCode);
  }

  async skipStage(applicationId: number, dto: DecisionBodyDto, actorId?: number) {
    const instance = await this.requireInstance(applicationId);
    const next = await this.repo.getNextStage(instance.current_stage_id);
    if (!next) throw new ValidationError('No next stage available');
    await this.repo.advanceStage(instance.id, next.id, { status: 'in_progress', remarks: dto.remarks });
    await this.statusSync.syncOnboardingStatus(applicationId, next.maps_to_status, actorId);
    await this.repo.addHistory({
      applicationId, instanceId: instance.id, stageId: instance.current_stage_id,
      nextStageId: next.id, decision: 'skip', decidedBy: actorId, remarks: dto.remarks,
    });
    return this.getWorkflow(applicationId);
  }

  async goLive(applicationId: number, actorId?: number) {
    const app = await this.requireApp(applicationId);
    const instance = await this.requireInstance(applicationId);
    const approvedStage = await this.repo.getStageByCode('approved');
    const goLiveStage = await this.repo.getStageByCode('go_live');
    const completedStage = await this.repo.getStageByCode('completed');

    if (!['approved', 'business_review'].includes(app.onboarding_status) && instance.stage_code !== 'approved') {
      const current = await this.repo.getStageById(instance.current_stage_id);
      if (current?.code !== 'approved' && current?.code !== 'go_live') {
        throw new ValidationError('Application must be approved before go live');
      }
    }

    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');

    const merchantId = await this.goLiveService.execute(applicationId, orgId, actorId);

    if (goLiveStage) {
      await this.repo.advanceStage(instance.id, goLiveStage.id, { status: 'in_progress' });
      await this.repo.addHistory({
        applicationId, instanceId: instance.id, stageId: goLiveStage.id,
        previousStageId: approvedStage?.id, decision: 'go_live', decidedBy: actorId,
        remarks: `Merchant #${merchantId} went live`,
      });
    }
    if (completedStage) {
      await this.repo.advanceStage(instance.id, completedStage.id, { status: 'completed' });
      await this.statusSync.syncOnboardingStatus(applicationId, 'completed', actorId);
      await this.repo.addHistory({
        applicationId, instanceId: instance.id, stageId: completedStage.id,
        previousStageId: goLiveStage?.id, decision: 'activated', decidedBy: actorId,
      });
    }

    await this.onboardingRepo.addTimeline(applicationId, 'go_live', `Merchant #${merchantId} went live`, actorId);
    void notificationDispatch.dispatch({
      userId: actorId!, eventCode: 'onboarding_go_live_done',
      body: `Merchant go live completed for application ${app.application_ref}.`,
      category: 'merchant', relatedEntityType: 'merchant', relatedEntityId: merchantId,
    }).catch(() => {});
    void auditRecorder.record({
      module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'onboarding_go_live',
      entityType: 'merchant', entityId: String(merchantId),
      description: `Go live completed for ${app.application_ref}`, riskLevel: 'high', userId: actorId,
    }).catch(() => {});

    return { merchantId, workflow: await this.getWorkflow(applicationId) };
  }

  async suspend(applicationId: number, reason: string, actorId?: number) {
    const app = await this.requireApp(applicationId);
    if (!app.merchant_id) throw new ValidationError('No merchant linked');
    await this.statusSync.syncSuspend(applicationId, Number(app.merchant_id), actorId);
    await this.onboardingRepo.addTimeline(applicationId, 'suspended', reason, actorId);
    void auditRecorder.record({
      module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'onboarding_suspend',
      entityType: 'merchant', entityId: String(app.merchant_id), description: reason, riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    return { success: true };
  }

  async activate(applicationId: number, actorId?: number) {
    const app = await this.requireApp(applicationId);
    if (!app.merchant_id) throw new ValidationError('No merchant linked');
    await this.statusSync.syncActivate(applicationId, Number(app.merchant_id), actorId);
    void notificationDispatch.dispatch({
      userId: actorId!, eventCode: 'merchant_activated',
      body: `Merchant account reactivated for ${app.application_ref}.`, category: 'merchant',
    }).catch(() => {});
    return { success: true };
  }

  async complianceQueue(query: ComplianceQueueQueryDto) {
    const { items, total } = await this.repo.listQueue(query);
    return {
      items: items.map((i) => this.mapInstance(i)),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async bulkAssign(dto: BulkAssignBodyDto, actorId?: number) {
    await this.repo.bulkAssign(dto.instanceIds, dto.userId, dto.roleCode);
    for (const id of dto.instanceIds) {
      void auditRecorder.record({
        module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'workflow_reassign',
        entityType: 'workflow_instance', entityId: String(id), description: 'Bulk assigned', riskLevel: 'low', userId: actorId,
      }).catch(() => {});
    }
    return { assigned: dto.instanceIds.length };
  }

  async getRiskReview(applicationId: number) {
    await this.requireApp(applicationId);
    const review = await this.riskRepo.findByApplication(applicationId);
    return review ? this.mapRisk(review) : null;
  }

  async saveRiskReview(applicationId: number, dto: RiskReviewBodyDto, actorId?: number) {
    await this.requireApp(applicationId);
    const finalScore = dto.finalRiskScore ?? this.calcFinalScore(dto);
    const id = await this.riskRepo.upsert(applicationId, {
      business_category: dto.businessCategory,
      country: dto.country, state: dto.state,
      kyc_score: dto.kycScore, document_verification_score: dto.documentVerificationScore,
      watchlist_match: dto.watchlistMatch ? 1 : 0, blacklist_match: dto.blacklistMatch ? 1 : 0,
      manual_risk_score: dto.manualRiskScore, final_risk_score: finalScore,
      risk_level: dto.riskLevel ?? this.scoreToLevel(finalScore),
      reviewer_remarks: dto.reviewerRemarks, decision: dto.decision ?? 'pending',
    }, actorId);
    void auditRecorder.record({
      module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'risk_decision',
      entityType: 'risk_review', entityId: String(id), description: dto.reviewerRemarks ?? 'Risk review updated',
      riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    return this.getRiskReview(applicationId);
  }

  async listKycDocuments(applicationId: number) {
    await this.requireApp(applicationId);
    const docs = await this.kycRepo.listByApplication(applicationId);
    const timeline = await this.kycRepo.getVerificationTimeline(applicationId);
    return {
      documents: docs.map((d) => ({
        id: d.id, uuid: d.uuid, documentType: d.document_type, fileName: d.file_name,
        verificationStatus: d.verification_status, version: d.version, expiresAt: d.expires_at,
        verifiedBy: d.verified_by, verifierName: d.verifier_name, verifiedAt: d.verified_at,
        verifierRemarks: d.verifier_remarks,
      })),
      timeline: timeline.map((t) => ({
        documentType: t.document_type, eventType: t.event_type, actorName: t.actor_name,
        remarks: t.remarks, createdAt: t.created_at,
      })),
    };
  }

  async kycDecision(applicationId: number, documentId: number, dto: KycDecisionBodyDto, actorId?: number) {
    await this.requireApp(applicationId);
    const eventMap: Record<string, string> = {
      approved: 'approved', rejected: 'rejected', reupload_requested: 'reupload_requested',
    };
    if (dto.decision === 'reupload_requested') {
      await this.kycRepo.requestReupload(documentId, applicationId, actorId, dto.remarks);
    } else {
      await this.kycRepo.updateVerification(documentId, dto.decision, actorId, dto.remarks);
      await this.kycRepo.addVerificationEvent(documentId, applicationId, eventMap[dto.decision] ?? dto.decision, actorId, dto.remarks);
    }
    void auditRecorder.record({
      module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'kyc_verified',
      entityType: 'kyc_document', entityId: String(documentId), description: dto.remarks ?? dto.decision,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.listKycDocuments(applicationId);
  }

  async getDashboardStats() {
    const orgId = getOrganizationId();
    const stats = await this.repo.getDashboardStats(orgId);
    return {
      pendingCompliance: Number(stats.pending_compliance ?? 0),
      pendingRisk: Number(stats.pending_risk ?? 0),
      pendingApprovals: Number(stats.pending_approvals ?? 0),
      goLiveToday: Number(stats.go_live_today ?? 0),
      slaBreaches: Number(stats.sla_breaches ?? 0),
      rejectedToday: Number(stats.rejected_today ?? 0),
    };
  }

  private async transition(applicationId: number, action: 'approve' | 'reject', dto: DecisionBodyDto, actorId?: number) {
    const instance = await this.requireInstance(applicationId);
    if (action === 'reject') {
      const rejectedStage = await this.repo.getStageByCode('rejected');
      if (!rejectedStage) throw new ValidationError('Rejected stage not configured');
      await this.repo.advanceStage(instance.id, rejectedStage.id, { status: 'rejected', remarks: dto.remarks });
      await this.statusSync.syncOnboardingStatus(applicationId, 'rejected', actorId);
      await this.repo.updateInstanceStatus(instance.id, 'rejected', true);
      await this.repo.addHistory({
        applicationId, instanceId: instance.id, stageId: instance.current_stage_id,
        nextStageId: rejectedStage.id, decision: 'reject', decidedBy: actorId, remarks: dto.remarks,
      });
      void auditRecorder.record({
        module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'workflow_reject',
        entityType: 'merchant_onboarding', entityId: String(applicationId), description: dto.remarks ?? 'Rejected',
        riskLevel: 'high', userId: actorId,
      }).catch(() => {});
      return this.getWorkflow(applicationId);
    }

    const next = await this.repo.getNextStage(instance.current_stage_id);
    if (!next) throw new ValidationError('No next stage');
    await this.repo.advanceStage(instance.id, next.id, { status: next.code === 'approved' ? 'completed' : 'in_progress', remarks: dto.remarks });
    await this.statusSync.syncOnboardingStatus(applicationId, next.maps_to_status, actorId);
    if (next.code === 'approved') await this.repo.updateInstanceStatus(instance.id, 'completed', true);
    await this.repo.addHistory({
      applicationId, instanceId: instance.id, stageId: instance.current_stage_id,
      nextStageId: next.id, decision: 'approve', decidedBy: actorId, remarks: dto.remarks,
    });
    void auditRecorder.record({
      module: 'onboarding_approval', categoryCode: 'merchants', actionCode: 'workflow_approve',
      entityType: 'merchant_onboarding', entityId: String(applicationId), description: dto.remarks ?? 'Approved',
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getWorkflow(applicationId);
  }

  private calcFinalScore(dto: RiskReviewBodyDto): number {
    const scores = [dto.kycScore, dto.documentVerificationScore, dto.manualRiskScore].filter((s) => s != null) as number[];
    if (!scores.length) return 50;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private scoreToLevel(score: number): string {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private mapInstance(i: import('../repositories/workflow.repository').WorkflowInstanceRow) {
    return {
      id: i.id, applicationId: i.application_id, applicationRef: i.application_ref,
      businessName: i.business_name, organizationId: i.organization_id, organizationName: i.organization_name,
      currentStageId: i.current_stage_id, stageCode: i.stage_code, stageName: i.stage_name,
      assignedUserId: i.assigned_user_id, assignedUserName: i.assigned_user_name,
      assignedRoleCode: i.assigned_role_code, priority: i.priority, workflowStatus: i.workflow_status,
      slaDueAt: i.sla_due_at, slaBreached: Boolean(i.sla_breached), remarks: i.remarks,
    };
  }

  private mapRisk(r: import('mysql2/promise').RowDataPacket) {
    return {
      id: r.id, applicationId: r.application_id, businessCategory: r.business_category,
      country: r.country, state: r.state, kycScore: r.kyc_score ? Number(r.kyc_score) : null,
      documentVerificationScore: r.document_verification_score ? Number(r.document_verification_score) : null,
      watchlistMatch: Boolean(r.watchlist_match), blacklistMatch: Boolean(r.blacklist_match),
      manualRiskScore: r.manual_risk_score ? Number(r.manual_risk_score) : null,
      finalRiskScore: r.final_risk_score ? Number(r.final_risk_score) : null,
      riskLevel: r.risk_level, reviewerRemarks: r.reviewer_remarks, decision: r.decision,
      reviewedAt: r.reviewed_at,
    };
  }

  private async requireApp(id: number) {
    const app = await this.onboardingRepo.findById(id);
    if (!app) throw new NotFoundError('Application not found');
    return app;
  }

  private async requireInstance(applicationId: number) {
    const instance = await this.repo.findInstanceByApplication(applicationId);
    if (!instance) throw new NotFoundError('Workflow instance not found');
    return instance;
  }

  private notify(userId: number | undefined, eventCode: string, applicationId: number, body?: string) {
    if (!userId) return;
    void notificationDispatch.dispatch({
      userId, eventCode, body: body ?? 'Onboarding status updated', category: 'merchant',
      relatedEntityType: 'merchant_onboarding', relatedEntityId: applicationId,
    }).catch(() => {});
  }
}
