import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/invoices.validator';
import {
  createInvoiceBodySchema,
  emailInvoiceBodySchema,
  invoiceIdParamSchema,
  invoiceListQuerySchema,
  markPaidBodySchema,
  updateInvoiceBodySchema,
} from '../dto';

const router = Router();
const controller = new InvoiceController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.INVOICES_READ), asyncHandler(controller.statistics));
router.get('/analytics', authorize(PERMISSIONS.INVOICES_READ), asyncHandler(controller.analytics));
router.get('/templates', authorize(PERMISSIONS.INVOICES_READ), asyncHandler(controller.listTemplates));
router.post('/templates', authorize(PERMISSIONS.INVOICES_WRITE), asyncHandler(controller.createTemplate));
router.get('/templates/:id', authorize(PERMISSIONS.INVOICES_READ), asyncHandler(controller.getTemplate));
router.put('/templates/:id', authorize(PERMISSIONS.INVOICES_WRITE), asyncHandler(controller.updateTemplate));
router.delete('/templates/:id', authorize(PERMISSIONS.INVOICES_MANAGE), asyncHandler(controller.deleteTemplate));
router.get('/credit-notes', authorize(PERMISSIONS.INVOICES_READ), asyncHandler(controller.listCreditNotes));
router.post('/credit-notes', authorize(PERMISSIONS.INVOICES_WRITE), asyncHandler(controller.createCreditNote));
router.get('/debit-notes', authorize(PERMISSIONS.INVOICES_READ), asyncHandler(controller.listDebitNotes));
router.post('/debit-notes', authorize(PERMISSIONS.INVOICES_WRITE), asyncHandler(controller.createDebitNote));
router.get('/', authorize(PERMISSIONS.INVOICES_READ), validateQuery(invoiceListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.INVOICES_WRITE), validateBody(createInvoiceBodySchema), asyncHandler(controller.create));
router.get('/:id/pdf', authorize(PERMISSIONS.INVOICES_READ), validateParams(invoiceIdParamSchema), asyncHandler(controller.downloadPdf));
router.get('/:id/pdf/metadata', authorize(PERMISSIONS.INVOICES_READ), validateParams(invoiceIdParamSchema), asyncHandler(controller.pdfMetadata));
router.post('/:id/duplicate', authorize(PERMISSIONS.INVOICES_WRITE), validateParams(invoiceIdParamSchema), asyncHandler(controller.duplicate));
router.post('/:id/void', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), asyncHandler(controller.voidInvoice));
router.post('/:id/cancel', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), asyncHandler(controller.cancel));
router.post('/:id/send', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), asyncHandler(controller.markSent));
router.post('/:id/mark-viewed', authorize(PERMISSIONS.INVOICES_READ), validateParams(invoiceIdParamSchema), asyncHandler(controller.markViewed));
router.post('/:id/mark-overdue', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), asyncHandler(controller.markOverdue));
router.post('/:id/mark-paid', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), validateBody(markPaidBodySchema), asyncHandler(controller.markPaid));
router.post('/:id/email', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), validateBody(emailInvoiceBodySchema), asyncHandler(controller.email));
router.post('/:id/payment-link', authorize(PERMISSIONS.INVOICES_WRITE), validateParams(invoiceIdParamSchema), asyncHandler(controller.generatePaymentLink));
router.post('/:id/payment-link/regenerate', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), asyncHandler(controller.regeneratePaymentLink));
router.post('/:id/payment-link/disable', authorize(PERMISSIONS.INVOICES_MANAGE), validateParams(invoiceIdParamSchema), asyncHandler(controller.disablePaymentLink));
router.get('/:id', authorize(PERMISSIONS.INVOICES_READ), validateParams(invoiceIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.INVOICES_WRITE), validateParams(invoiceIdParamSchema), validateBody(updateInvoiceBodySchema), asyncHandler(controller.update));

export { router as invoiceRoutes };
