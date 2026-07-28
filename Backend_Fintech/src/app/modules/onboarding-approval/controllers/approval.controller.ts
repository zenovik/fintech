import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflow.service';
import {
  BulkAssignBodyDto, ComplianceQueueQueryDto, DecisionBodyDto, ReassignBodyDto,
  RiskReviewBodyDto, KycDecisionBodyDto,
} from '../dto';

export class ApprovalController {
  constructor(private readonly service = new WorkflowService()) {}

  stages = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getStages());
  };

  dashboardStats = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getDashboardStats());
  };

  complianceQueue = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.complianceQueue(req.query as unknown as ComplianceQueueQueryDto));
  };

  bulkAssign = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.bulkAssign(req.body as BulkAssignBodyDto, req.user?.sub));
  };

  getWorkflow = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getWorkflow(Number(req.params.applicationId)));
  };

  startWorkflow = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.startWorkflow(Number(req.params.applicationId), req.user?.sub));
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.approve(Number(req.params.applicationId), req.body as DecisionBodyDto, req.user?.sub));
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.reject(Number(req.params.applicationId), req.body as DecisionBodyDto, req.user?.sub));
  };

  sendBack = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.sendBack(Number(req.params.applicationId), req.body as DecisionBodyDto, req.user?.sub));
  };

  reassign = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.reassign(Number(req.params.applicationId), req.body as ReassignBodyDto, req.user?.sub));
  };

  skipStage = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.skipStage(Number(req.params.applicationId), req.body as DecisionBodyDto, req.user?.sub));
  };

  goLive = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.goLive(Number(req.params.applicationId), req.user?.sub));
  };

  suspend = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.suspend(Number(req.params.applicationId), req.body.reason, req.user?.sub));
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.activate(Number(req.params.applicationId), req.user?.sub));
  };

  getRisk = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getRiskReview(Number(req.params.applicationId)));
  };

  saveRisk = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.saveRiskReview(Number(req.params.applicationId), req.body as RiskReviewBodyDto, req.user?.sub));
  };

  listKyc = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listKycDocuments(Number(req.params.applicationId)));
  };

  kycDecision = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.kycDecision(
      Number(req.params.applicationId), Number(req.params.documentId),
      req.body as KycDecisionBodyDto, req.user?.sub,
    ));
  };
}
