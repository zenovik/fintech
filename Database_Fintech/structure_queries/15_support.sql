-- =============================================================================
-- 15_support.sql
-- Support tickets, notes, attachments metadata, activity timeline
-- =============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NULL,
  customer_id         BIGINT UNSIGNED     NULL,
  ticket_ref          VARCHAR(30)         NOT NULL,
  subject             VARCHAR(255)        NOT NULL,
  description         TEXT                NOT NULL,
  category            VARCHAR(64)         NOT NULL DEFAULT 'general',
  status              ENUM('open','assigned','in_progress','waiting_customer','resolved','closed','cancelled') NOT NULL DEFAULT 'open',
  priority            ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  sla_due_at          DATETIME            NULL,
  sla_breached        TINYINT(1)          NOT NULL DEFAULT 0,
  assigned_to         BIGINT UNSIGNED     NULL,
  escalated_at        DATETIME            NULL,
  escalated_to        BIGINT UNSIGNED     NULL,
  escalation_level    TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  related_entity_type VARCHAR(64)         NULL,
  related_entity_id   VARCHAR(100)        NULL,
  resolved_at         DATETIME            NULL,
  closed_at           DATETIME            NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_support_tickets_uuid (uuid),
  UNIQUE KEY uk_support_tickets_ref (ticket_ref),
  KEY idx_support_tickets_org (organization_id),
  KEY idx_support_tickets_merchant (merchant_id),
  KEY idx_support_tickets_customer (customer_id),
  KEY idx_support_tickets_status (status),
  KEY idx_support_tickets_priority (priority),
  KEY idx_support_tickets_assigned (assigned_to),
  KEY idx_support_tickets_sla (sla_due_at),
  KEY idx_support_tickets_deleted (deleted_at),
  CONSTRAINT fk_support_tickets_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_escalated_to
    FOREIGN KEY (escalated_to) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_ticket_notes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  ticket_id       BIGINT UNSIGNED     NOT NULL,
  author_id       BIGINT UNSIGNED     NULL,
  body            TEXT                NOT NULL,
  is_internal     TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_notes_ticket (ticket_id),
  CONSTRAINT fk_support_notes_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_support_notes_author
    FOREIGN KEY (author_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_ticket_attachments (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  ticket_id       BIGINT UNSIGNED     NOT NULL,
  file_name       VARCHAR(255)        NOT NULL,
  mime_type       VARCHAR(128)        NOT NULL,
  file_size       BIGINT UNSIGNED     NOT NULL DEFAULT 0,
  storage_path    VARCHAR(512)        NULL,
  uploaded_by     BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_attachments_ticket (ticket_id),
  CONSTRAINT fk_support_attachments_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_support_attachments_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_ticket_activities (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  ticket_id       BIGINT UNSIGNED     NOT NULL,
  activity_type   VARCHAR(64)         NOT NULL,
  summary         VARCHAR(512)        NOT NULL,
  actor_id        BIGINT UNSIGNED     NULL,
  metadata        JSON                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_activities_ticket (ticket_id),
  KEY idx_support_activities_created (created_at),
  CONSTRAINT fk_support_activities_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_support_activities_actor
    FOREIGN KEY (actor_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
