import { z } from 'zod';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../constants/support.constants';

export const ticketListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedTo: z.coerce.number().int().min(1).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
  slaBreached: z.coerce.boolean().optional(),
  sortBy: z.enum(['created_at', 'priority', 'sla_due_at', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createTicketBodySchema = z.object({
  merchantId: z.number().int().min(1).optional(),
  customerId: z.number().int().min(1).optional(),
  subject: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  category: z.string().max(64).optional().default('general'),
  priority: z.enum(TICKET_PRIORITIES).optional().default('medium'),
  relatedEntityType: z.string().max(64).optional(),
  relatedEntityId: z.string().max(100).optional(),
});

export const updateTicketBodySchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().max(64).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  relatedEntityType: z.string().max(64).optional(),
  relatedEntityId: z.string().max(100).optional(),
});

export const assignTicketBodySchema = z.object({
  assigneeId: z.number().int().min(1),
});

export const escalateTicketBodySchema = z.object({
  assigneeId: z.number().int().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export const addNoteBodySchema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(true),
});

export const addAttachmentBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  fileSize: z.number().int().min(0),
  storagePath: z.string().max(512).optional(),
});

export const ticketIdParamSchema = z.object({ id: z.coerce.number().int().min(1) });

export type TicketListQueryDto = z.infer<typeof ticketListQuerySchema>;
export type CreateTicketBodyDto = z.infer<typeof createTicketBodySchema>;
export type UpdateTicketBodyDto = z.infer<typeof updateTicketBodySchema>;
export type AssignTicketBodyDto = z.infer<typeof assignTicketBodySchema>;
export type EscalateTicketBodyDto = z.infer<typeof escalateTicketBodySchema>;
export type AddNoteBodyDto = z.infer<typeof addNoteBodySchema>;
export type AddAttachmentBodyDto = z.infer<typeof addAttachmentBodySchema>;
