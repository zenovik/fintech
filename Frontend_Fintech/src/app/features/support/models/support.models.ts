export interface ApiResponse<T> { success: boolean; message?: string; data?: T; }

export interface TicketSummary {
  id: number; ticketRef: string; subject: string; category: string; status: string; priority: string;
  merchantId: number | null; merchantName: string | null; customerId: number | null; customerName: string | null;
  assigneeName: string | null; slaDueAt: string | null; slaBreached: boolean; createdAt: string;
}

export interface TicketNote { id: number; body: string; isInternal: boolean; authorName: string | null; createdAt: string; }
export interface TicketAttachment { id: number; fileName: string; mimeType: string; fileSize: number; storagePath: string | null; uploadedByName: string | null; createdAt: string; }
export interface TicketActivity { id: number; activityType: string; summary: string; actorName: string | null; metadata: unknown; createdAt: string; }

export interface TicketDetail extends TicketSummary {
  description: string; organizationName: string | null; assignedTo: number | null;
  escalatedAt: string | null; escalationLevel: number; relatedEntityType: string | null; relatedEntityId: string | null;
  resolvedAt: string | null; closedAt: string | null; createdByName: string | null; updatedAt: string;
  notes: TicketNote[]; attachments: TicketAttachment[]; activities: TicketActivity[];
}

export interface TicketStats {
  total: number; open: number; resolved: number; closed: number; slaBreached: number;
  avgResolutionHours: number; slaComplianceRate: number;
}

export interface TicketListResponse {
  items: TicketSummary[]; stats: TicketStats;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateTicketPayload {
  merchantId?: number; customerId?: number; subject: string; description: string;
  category?: string; priority?: string; relatedEntityType?: string; relatedEntityId?: string;
}

export interface UpdateTicketPayload {
  subject?: string; description?: string; category?: string; priority?: string; status?: string;
  relatedEntityType?: string; relatedEntityId?: string;
}
