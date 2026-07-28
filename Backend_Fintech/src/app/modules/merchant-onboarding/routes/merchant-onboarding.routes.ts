import { Router } from 'express';
import { MerchantOnboardingController } from '../controllers/merchant-onboarding.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/merchant-onboarding.validator';
import {
  addressesBodySchema, applicationIdParamSchema, bankDetailsSchema, businessInfoSchema,
  kycDocumentsBodySchema, onboardingListQuerySchema, paymentConfigSchema, rejectBodySchema,
  settlementConfigSchema, suspendBodySchema,
} from '../dto';

const router = Router();
const controller = new MerchantOnboardingController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.MERCHANT_ONBOARDING_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.MERCHANT_ONBOARDING_READ), validateQuery(onboardingListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.MERCHANT_ONBOARDING_READ), validateParams(applicationIdParamSchema), asyncHandler(controller.getById));
router.get('/:id/timeline', authorize(PERMISSIONS.MERCHANT_ONBOARDING_READ), validateParams(applicationIdParamSchema), asyncHandler(controller.timeline));
router.put('/:id/business', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), validateBody(businessInfoSchema), asyncHandler(controller.saveBusiness));
router.put('/:id/addresses', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), validateBody(addressesBodySchema), asyncHandler(controller.saveAddresses));
router.put('/:id/kyc', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), validateBody(kycDocumentsBodySchema), asyncHandler(controller.saveKyc));
router.put('/:id/bank', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), validateBody(bankDetailsSchema), asyncHandler(controller.saveBank));
router.put('/:id/settlement', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), validateBody(settlementConfigSchema), asyncHandler(controller.saveSettlement));
router.put('/:id/payment', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), validateBody(paymentConfigSchema), asyncHandler(controller.savePayment));
router.post('/:id/submit', authorize(PERMISSIONS.MERCHANT_ONBOARDING_WRITE), validateParams(applicationIdParamSchema), asyncHandler(controller.submit));
router.post('/:id/approve', authorize(PERMISSIONS.MERCHANT_ONBOARDING_APPROVE), validateParams(applicationIdParamSchema), asyncHandler(controller.approve));
router.post('/:id/reject', authorize(PERMISSIONS.MERCHANT_ONBOARDING_REJECT), validateParams(applicationIdParamSchema), validateBody(rejectBodySchema), asyncHandler(controller.reject));
router.post('/:id/go-live', authorize(PERMISSIONS.MERCHANT_ONBOARDING_APPROVE), validateParams(applicationIdParamSchema), asyncHandler(controller.goLive));
router.post('/:id/suspend', authorize(PERMISSIONS.MERCHANT_ONBOARDING_SUSPEND), validateParams(applicationIdParamSchema), validateBody(suspendBodySchema), asyncHandler(controller.suspend));

export { router as merchantOnboardingRoutes };
