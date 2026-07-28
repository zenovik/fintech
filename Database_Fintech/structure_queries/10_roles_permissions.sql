-- =============================================================================
-- 10_roles_permissions.sql
-- User & Role Management — RBAC schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  description     TEXT                NULL,
  is_system       TINYINT(1)          NOT NULL DEFAULT 0,
  created_by      BIGINT UNSIGNED     NULL,
  updated_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_uuid (uuid),
  UNIQUE KEY uk_roles_code (code),
  KEY idx_roles_deleted_at (deleted_at),
  CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  code            VARCHAR(100)        NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  module          VARCHAR(50)         NOT NULL,
  description     TEXT                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissions_uuid (uuid),
  UNIQUE KEY uk_permissions_code (code),
  KEY idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Role ↔ Permission mapping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id         BIGINT UNSIGNED     NOT NULL,
  permission_id   BIGINT UNSIGNED     NOT NULL,
  granted_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by      BIGINT UNSIGNED     NULL,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_permission_id (permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- User ↔ Role mapping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  user_id         BIGINT UNSIGNED     NOT NULL,
  role_id         BIGINT UNSIGNED     NOT NULL,
  assigned_at     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by     BIGINT UNSIGNED     NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- User activity logs (admin module)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  actor_user_id   BIGINT UNSIGNED     NULL,
  action          VARCHAR(100)        NOT NULL,
  resource_type   VARCHAR(50)         NULL,
  resource_id     VARCHAR(100)        NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  metadata        JSON                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_activity_logs_uuid (uuid),
  KEY idx_user_activity_logs_user_id (user_id),
  KEY idx_user_activity_logs_actor_user_id (actor_user_id),
  KEY idx_user_activity_logs_action (action),
  KEY idx_user_activity_logs_created_at (created_at),
  CONSTRAINT fk_user_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_activity_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Login history (structured audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED     NULL,
  email_attempted VARCHAR(255)        NOT NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  success         TINYINT(1)          NOT NULL DEFAULT 0,
  failure_reason  VARCHAR(100)        NULL,
  session_id      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_history_user_id (user_id),
  KEY idx_login_history_email (email_attempted),
  KEY idx_login_history_success (success),
  KEY idx_login_history_created_at (created_at),
  CONSTRAINT fk_login_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_login_history_session FOREIGN KEY (session_id) REFERENCES user_sessions (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- API tokens (programmatic access)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_tokens (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  token_hash      VARCHAR(255)        NOT NULL,
  scopes          JSON                NULL,
  last_used_at    DATETIME            NULL,
  expires_at      DATETIME            NULL,
  revoked_at      DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_api_tokens_uuid (uuid),
  UNIQUE KEY uk_api_tokens_hash (token_hash),
  KEY idx_api_tokens_user_id (user_id),
  KEY idx_api_tokens_expires_at (expires_at),
  KEY idx_api_tokens_deleted_at (deleted_at),
  CONSTRAINT fk_api_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_api_tokens_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
