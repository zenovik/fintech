import { Router } from 'express';
import { ChargebackController } from '../controllers/chargeback.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/chargebacks.validator';
import {
  addEvidenceBodySchema,
  chargebackIdParamSchema,
  chargebackListQuerySchema,
  createChargebackBodySchema,
  representmentBodySchema,
  resolveChargebackBodySchema,
} from '../dto';

const router = Router();
const controller = new ChargebackController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.CHARGEBACKS_READ), asyncHandler(controller.statistics));
router.get('/sla-dashboard', authorize(PERMISSIONS.CHARGEBACKS_READ), asyncHandler(controller.slaDashboard));
router.get('/analytics', authorize(PERMISSIONS.CHARGEBACKS_READ), asyncHandler(controller.analytics));
router.get('/', authorize(PERMISSIONS.CHARGEBACKS_READ), validateQuery(chargebackListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.CHARGEBACKS_WRITE), validateBody(createChargebackBodySchema), asyncHandler(controller.create));
router.get('/:id/history', authorize(PERMISSIONS.CHARGEBACKS_READ), validateParams(chargebackIdParamSchema), asyncHandler(controller.history));
router.get('/:id/evidence', authorize(PERMISSIONS.CHARGEBACKS_READ), validateParams(chargebackIdParamSchema), asyncHandler(controller.evidence));
router.post('/:id/evidence', authorize(PERMISSIONS.CHARGEBACKS_WRITE), validateParams(chargebackIdParamSchema), validateBody(addEvidenceBodySchema), asyncHandler(controller.addEvidence));
router.post('/:id/representment', authorize(PERMISSIONS.CHARGEBACKS_WRITE), validateParams(chargebackIdParamSchema), validateBody(representmentBodySchema), asyncHandler(controller.representment));
router.post('/:id/arbitration', authorize(PERMISSIONS.CHARGEBACKS_WRITE), validateParams(chargebackIdParamSchema), asyncHandler(controller.arbitration));
router.post('/:id/resolve', authorize(PERMISSIONS.CHARGEBACKS_RESOLVE), validateParams(chargebackIdParamSchema), validateBody(resolveChargebackBodySchema), asyncHandler(controller.resolve));
router.get('/:id', authorize(PERMISSIONS.CHARGEBACKS_READ), validateParams(chargebackIdParamSchema), asyncHandler(controller.getById));

export { router as chargebackRoutes };
