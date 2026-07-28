import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import {
  validateBody, validateParams, validateQuery,
  complianceQueueQuerySchema, applicationIdParamSchema, documentIdParamSchema,
  decisionBodySchema, reassignBodySchema, bulkAssignBodySchema,
  riskReviewBodySchema, kycDecisionBodySchema, suspendBodySchema,
} from '../validators/approval.validator';

const router = Router();
const controller = new ApprovalController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/stages', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_READ), asyncHandler(controller.stages));
router.get('/dashboard-stats', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_READ), asyncHandler(controller.dashboardStats));
router.get('/compliance-queue', authorize(PERMISSIONS.COMPLIANCE_QUEUE_READ), validateQuery(complianceQueueQuerySchema), asyncHandler(controller.complianceQueue));
router.post('/compliance-queue/bulk-assign', authorize(PERMISSIONS.COMPLIANCE_QUEUE_MANAGE), validateBody(bulkAssignBodySchema), asyncHandler(controller.bulkAssign));

router.get('/:applicationId/workflow', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_READ), validateParams(applicationIdParamSchema), asyncHandler(controller.getWorkflow));
router.post('/:applicationId/workflow/start', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_WRITE), validateParams(applicationIdParamSchema), asyncHandler(controller.startWorkflow));
router.post('/:applicationId/approve', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_APPROVE), validateParams(applicationIdParamSchema), validateBody(decisionBodySchema), asyncHandler(controller.approve));
router.post('/:applicationId/reject', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_REJECT), validateParams(applicationIdParamSchema), validateBody(decisionBodySchema), asyncHandler(controller.reject));
router.post('/:applicationId/send-back', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_SEND_BACK), validateParams(applicationIdParamSchema), validateBody(decisionBodySchema), asyncHandler(controller.sendBack));
router.post('/:applicationId/reassign', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_REASSIGN), validateParams(applicationIdParamSchema), validateBody(reassignBodySchema), asyncHandler(controller.reassign));
router.post('/:applicationId/skip-stage', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_SKIP), validateParams(applicationIdParamSchema), validateBody(decisionBodySchema), asyncHandler(controller.skipStage));
router.post('/:applicationId/go-live', authorize(PERMISSIONS.GO_LIVE_EXECUTE), validateParams(applicationIdParamSchema), asyncHandler(controller.goLive));
router.post('/:applicationId/suspend', authorize(PERMISSIONS.MERCHANT_ONBOARDING_SUSPEND), validateParams(applicationIdParamSchema), validateBody(suspendBodySchema), asyncHandler(controller.suspend));
router.post('/:applicationId/activate', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_APPROVE), validateParams(applicationIdParamSchema), asyncHandler(controller.activate));

router.get('/:applicationId/risk', authorize(PERMISSIONS.RISK_REVIEW_READ), validateParams(applicationIdParamSchema), asyncHandler(controller.getRisk));
router.put('/:applicationId/risk', authorize(PERMISSIONS.RISK_REVIEW_WRITE), validateParams(applicationIdParamSchema), validateBody(riskReviewBodySchema), asyncHandler(controller.saveRisk));

router.get('/:applicationId/kyc', authorize(PERMISSIONS.KYC_REVIEW_READ), validateParams(applicationIdParamSchema), asyncHandler(controller.listKyc));
router.post('/:applicationId/kyc/:documentId/decision', authorize(PERMISSIONS.KYC_REVIEW_WRITE), validateParams(documentIdParamSchema), validateBody(kycDecisionBodySchema), asyncHandler(controller.kycDecision));

export { router as onboardingApprovalRoutes };
