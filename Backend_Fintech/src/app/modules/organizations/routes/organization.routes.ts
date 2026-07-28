import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { optionalOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/organizations.validator';
import {
  apiKeyIdParamSchema,
  billingBodySchema,
  brandingBodySchema,
  createApiKeyBodySchema,
  createDomainBodySchema,
  createMemberBodySchema,
  createOrganizationBodySchema,
  domainIdParamSchema,
  memberIdParamSchema,
  organizationIdParamSchema,
  organizationListQuerySchema,
  preferencesBodySchema,
  updateDomainBodySchema,
  updateMemberBodySchema,
  updateOrganizationBodySchema,
  updateOrganizationStatusBodySchema,
} from '../dto';

const router = Router();
const controller = new OrganizationController();

router.use(authenticate);
router.use(optionalOrganization());

router.get('/mine', asyncHandler(controller.getMine));
router.get('/roles', authorize(PERMISSIONS.ORGANIZATIONS_READ), asyncHandler(controller.getRoles));
router.get('/', authorize(PERMISSIONS.ORGANIZATIONS_READ), validateQuery(organizationListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.ORGANIZATIONS_WRITE), validateBody(createOrganizationBodySchema), asyncHandler(controller.create));

router.get('/:id', authorize(PERMISSIONS.ORGANIZATIONS_READ), validateParams(organizationIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.ORGANIZATIONS_WRITE), validateParams(organizationIdParamSchema), validateBody(updateOrganizationBodySchema), asyncHandler(controller.update));
router.patch('/:id/status', authorize(PERMISSIONS.ORGANIZATIONS_WRITE), validateParams(organizationIdParamSchema), validateBody(updateOrganizationStatusBodySchema), asyncHandler(controller.updateStatus));
router.post('/:id/archive', authorize(PERMISSIONS.ORGANIZATIONS_DELETE), validateParams(organizationIdParamSchema), asyncHandler(controller.archive));
router.post('/:id/restore', authorize(PERMISSIONS.ORGANIZATIONS_WRITE), validateParams(organizationIdParamSchema), asyncHandler(controller.restore));

router.get('/:id/members', authorize(PERMISSIONS.ORGANIZATIONS_READ), validateParams(organizationIdParamSchema), asyncHandler(controller.getMembers));
router.post('/:id/members', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(organizationIdParamSchema), validateBody(createMemberBodySchema), asyncHandler(controller.addMember));
router.put('/:id/members/:memberId', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(memberIdParamSchema), validateBody(updateMemberBodySchema), asyncHandler(controller.updateMember));
router.delete('/:id/members/:memberId', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(memberIdParamSchema), asyncHandler(controller.removeMember));

router.get('/:id/domains', authorize(PERMISSIONS.ORGANIZATIONS_READ), validateParams(organizationIdParamSchema), asyncHandler(controller.getDomains));
router.post('/:id/domains', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(organizationIdParamSchema), validateBody(createDomainBodySchema), asyncHandler(controller.addDomain));
router.put('/:id/domains/:domainId', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(domainIdParamSchema), validateBody(updateDomainBodySchema), asyncHandler(controller.updateDomain));
router.delete('/:id/domains/:domainId', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(domainIdParamSchema), asyncHandler(controller.deleteDomain));

router.get('/:id/branding', authorize(PERMISSIONS.ORGANIZATIONS_READ), validateParams(organizationIdParamSchema), asyncHandler(controller.getBranding));
router.put('/:id/branding', authorize(PERMISSIONS.ORGANIZATIONS_WRITE), validateParams(organizationIdParamSchema), validateBody(brandingBodySchema), asyncHandler(controller.updateBranding));

router.get('/:id/preferences', authorize(PERMISSIONS.ORGANIZATIONS_READ), validateParams(organizationIdParamSchema), asyncHandler(controller.getPreferences));
router.put('/:id/preferences', authorize(PERMISSIONS.ORGANIZATIONS_WRITE), validateParams(organizationIdParamSchema), validateBody(preferencesBodySchema), asyncHandler(controller.updatePreferences));

router.get('/:id/api-keys', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(organizationIdParamSchema), asyncHandler(controller.getApiKeys));
router.post('/:id/api-keys', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(organizationIdParamSchema), validateBody(createApiKeyBodySchema), asyncHandler(controller.createApiKey));
router.delete('/:id/api-keys/:keyId', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(apiKeyIdParamSchema), asyncHandler(controller.revokeApiKey));

router.get('/:id/billing', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(organizationIdParamSchema), asyncHandler(controller.getBilling));
router.put('/:id/billing', authorize(PERMISSIONS.ORGANIZATIONS_MANAGE), validateParams(organizationIdParamSchema), validateBody(billingBodySchema), asyncHandler(controller.updateBilling));

export { router as organizationRoutes };
