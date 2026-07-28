-- =============================================================================
-- 04_auth.sql
-- Authentication supporting tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Password history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED     NOT NULL,
  password_hash   VARCHAR(255)        NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_password_history_user_id (user_id),
  KEY idx_password_history_created_at (created_at),
  CONSTRAINT fk_password_history_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Password reset tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED     NOT NULL,
  token_hash      VARCHAR(255)        NOT NULL,
  expires_at      DATETIME            NOT NULL,
  used_at         DATETIME            NULL,
  requested_ip    VARCHAR(45)         NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_password_reset_token_hash (token_hash),
  KEY idx_password_reset_user_id (user_id),
  KEY idx_password_reset_expires_at (expires_at),
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Trusted devices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trusted_devices (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  device_fingerprint  VARCHAR(255)    NOT NULL,
  device_label        VARCHAR(255)    NULL,
  trusted_until       DATETIME        NOT NULL,
  last_used_at        DATETIME        NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_trusted_devices_fingerprint (user_id, device_fingerprint),
  KEY idx_trusted_devices_user_id (user_id),
  KEY idx_trusted_devices_trusted_until (trusted_until),
  CONSTRAINT fk_trusted_devices_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- User sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  trusted_device_id BIGINT UNSIGNED   NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  device_name     VARCHAR(255)        NULL,
  browser         VARCHAR(100)        NULL,
  os              VARCHAR(100)        NULL,
  location_city   VARCHAR(100)        NULL,
  location_country VARCHAR(100)       NULL,
  status          ENUM('active', 'revoked', 'expired') NOT NULL DEFAULT 'active',
  last_activity_at DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME            NOT NULL,
  trusted_until   DATETIME            NULL,
  revoked_at      DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_sessions_uuid (uuid),
  KEY idx_user_sessions_user_id (user_id),
  KEY idx_user_sessions_status (status),
  KEY idx_user_sessions_last_activity (last_activity_at),
  KEY idx_user_sessions_expires_at (expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_sessions_trusted_device
    FOREIGN KEY (trusted_device_id) REFERENCES trusted_devices (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Refresh tokens (rotation support)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  session_id          BIGINT UNSIGNED NOT NULL,
  token_hash          VARCHAR(255)    NOT NULL,
  expires_at          DATETIME        NOT NULL,
  revoked_at          DATETIME        NULL,
  replaced_by_token_id BIGINT UNSIGNED NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_tokens_hash (token_hash),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_session_id (session_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_refresh_tokens_session
    FOREIGN KEY (session_id) REFERENCES user_sessions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_refresh_tokens_replaced_by
    FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Auth challenges (MFA / step-up between login and verify-otp)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_challenges (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  session_id      BIGINT UNSIGNED     NULL,
  challenge_type  ENUM('mfa_totp', 'mfa_sms', 'login_stepup') NOT NULL,
  status          ENUM('pending', 'verified', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  remember_device TINYINT(1)          NOT NULL DEFAULT 0,
  expires_at      DATETIME            NOT NULL,
  verified_at     DATETIME            NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_challenges_uuid (uuid),
  KEY idx_auth_challenges_user_id (user_id),
  KEY idx_auth_challenges_status (status),
  KEY idx_auth_challenges_expires_at (expires_at),
  CONSTRAINT fk_auth_challenges_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_auth_challenges_session
    FOREIGN KEY (session_id) REFERENCES user_sessions (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- OTP verifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  challenge_id        BIGINT UNSIGNED NULL,
  purpose             ENUM('login_stepup', 'mfa_sms', 'mfa_totp', 'password_reset') NOT NULL,
  otp_hash            VARCHAR(255)    NOT NULL,
  channel             ENUM('sms', 'email', 'totp') NOT NULL DEFAULT 'sms',
  destination_masked  VARCHAR(100)    NULL,
  attempts            INT UNSIGNED    NOT NULL DEFAULT 0,
  max_attempts        INT UNSIGNED    NOT NULL DEFAULT 5,
  expires_at          DATETIME        NOT NULL,
  verified_at         DATETIME        NULL,
  last_sent_at        DATETIME        NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_otp_verifications_user_id (user_id),
  KEY idx_otp_verifications_challenge_id (challenge_id),
  KEY idx_otp_verifications_purpose (purpose),
  KEY idx_otp_verifications_expires_at (expires_at),
  CONSTRAINT fk_otp_verifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_otp_verifications_challenge
    FOREIGN KEY (challenge_id) REFERENCES auth_challenges (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Login attempts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED     NULL,
  email_attempted VARCHAR(255)        NOT NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  success         TINYINT(1)          NOT NULL DEFAULT 0,
  failure_reason  VARCHAR(100)        NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_attempts_user_id (user_id),
  KEY idx_login_attempts_email (email_attempted),
  KEY idx_login_attempts_ip (ip_address),
  KEY idx_login_attempts_created_at (created_at),
  CONSTRAINT fk_login_attempts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Authentication audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED     NULL,
  session_id      BIGINT UNSIGNED     NULL,
  event_type      VARCHAR(50)         NOT NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  metadata        JSON                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auth_audit_user_id (user_id),
  KEY idx_auth_audit_session_id (session_id),
  KEY idx_auth_audit_event_type (event_type),
  KEY idx_auth_audit_created_at (created_at),
  CONSTRAINT fk_auth_audit_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_auth_audit_session
    FOREIGN KEY (session_id) REFERENCES user_sessions (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- SSO identities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sso_identities (
  id                BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED   NOT NULL,
  provider          ENUM('google', 'github') NOT NULL,
  provider_user_id  VARCHAR(255)      NOT NULL,
  email             VARCHAR(255)      NULL,
  created_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sso_provider_user (provider, provider_user_id),
  KEY idx_sso_identities_user_id (user_id),
  CONSTRAINT fk_sso_identities_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
