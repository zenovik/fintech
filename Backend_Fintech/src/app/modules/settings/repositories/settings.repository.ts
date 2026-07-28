import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { encryptSecret } from '../../../shared/crypto/secret-crypto';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  ApiSettingsDto,
  BrandingSettingsDto,
  CreateFeatureFlagBodyDto,
  FeatureFlagListQueryDto,
  NotificationPreferencesBodyDto,
  OrganizationSettingsDto,
  PasswordPolicyDto,
  SecuritySettingsDto,
  SessionSettingsDto,
  SmtpSettingsDto,
  StorageSettingsDto,
  UpdateFeatureFlagBodyDto,
} from '../dto';

type Row = RowDataPacket & Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapOrganization(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    legalName: row['legal_name'] as string,
    dbaName: row['dba_name'] as string | null,
    taxId: row['tax_id'] as string | null,
    addressLine1: row['address_line1'] as string | null,
    addressLine2: row['address_line2'] as string | null,
    city: row['city'] as string | null,
    state: row['state'] as string | null,
    postalCode: row['postal_code'] as string | null,
    country: row['country'] as string | null,
    baseCurrency: row['base_currency'] as string,
    timezone: row['timezone'] as string,
    primaryRegion: row['primary_region'] as string | null,
    publicProfileEnabled: Boolean(row['public_profile_enabled']),
    payoutNotificationsEnabled: Boolean(row['payout_notifications_enabled']),
    updatedAt: row['updated_at'] as string,
  };
}

function mapBranding(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    companyName: row['company_name'] as string,
    logoUrl: row['logo_url'] as string | null,
    logoInitials: row['logo_initials'] as string | null,
    primaryColor: row['primary_color'] as string,
    secondaryColor: row['secondary_color'] as string,
    accentColor: row['accent_color'] as string,
    faviconUrl: row['favicon_url'] as string | null,
    updatedAt: row['updated_at'] as string,
  };
}

function mapSecurity(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    mfaEnforced: Boolean(row['mfa_enforced']),
    mfaMethodsAllowed: parseJson<string[]>(row['mfa_methods_allowed'], []),
    ipWhitelistEnabled: Boolean(row['ip_whitelist_enabled']),
    ipWhitelist: parseJson<string[]>(row['ip_whitelist'], []),
    apiIpRestrictions: parseJson<string[]>(row['api_ip_restrictions'], []),
    geoLoginEnabled: Boolean(row['geo_login_enabled']),
    riskLoginThreshold: row['risk_login_threshold'] as number,
    updatedAt: row['updated_at'] as string,
  };
}

function mapPasswordPolicy(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    minLength: row['min_length'] as number,
    requireUppercase: Boolean(row['require_uppercase']),
    requireLowercase: Boolean(row['require_lowercase']),
    requireNumber: Boolean(row['require_number']),
    requireSpecial: Boolean(row['require_special']),
    maxAgeDays: row['max_age_days'] as number,
    historyCount: row['history_count'] as number,
    updatedAt: row['updated_at'] as string,
  };
}

function mapSession(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    idleTimeoutMinutes: row['idle_timeout_minutes'] as number,
    maxSessionDurationMinutes: row['max_session_duration_minutes'] as number,
    maxConcurrentSessions: row['max_concurrent_sessions'] as number,
    rememberDeviceDays: row['remember_device_days'] as number,
    updatedAt: row['updated_at'] as string,
  };
}

function mapApi(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    apiBaseUrl: row['api_base_url'] as string | null,
    webhookRetryCount: row['webhook_retry_count'] as number,
    webhookTimeoutSeconds: row['webhook_timeout_seconds'] as number,
    rateLimitPerMinute: row['rate_limit_per_minute'] as number,
    updatedAt: row['updated_at'] as string,
  };
}

function mapSmtp(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    host: row['host'] as string | null,
    port: row['port'] as number,
    username: row['username'] as string | null,
    fromEmail: row['from_email'] as string | null,
    fromName: row['from_name'] as string | null,
    useTls: Boolean(row['use_tls']),
    hasPassword: Boolean(row['password_encrypted_v2'] ?? row['password_encrypted']),
    updatedAt: row['updated_at'] as string,
  };
}

function mapStorage(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    provider: row['provider'] as string,
    bucketName: row['bucket_name'] as string | null,
    region: row['region'] as string | null,
    maxUploadMb: row['max_upload_mb'] as number,
    allowedExtensions: parseJson<string[]>(row['allowed_extensions'], []),
    updatedAt: row['updated_at'] as string,
  };
}

function mapFeatureFlag(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    code: row['code'] as string,
    name: row['name'] as string,
    description: row['description'] as string | null,
    isEnabled: Boolean(row['is_enabled']),
    isBeta: Boolean(row['is_beta']),
    rolloutPercentage: row['rollout_percentage'] as number,
    updatedAt: row['updated_at'] as string,
  };
}

function mapNotificationPref(row: Row) {
  return {
    notificationType: row['notification_type'] as string,
    channel: row['channel'] as string,
    isEnabled: Boolean(row['is_enabled']),
  };
}

export class SettingsRepository {
  private async getSingleton(table: string): Promise<Row | null> {
    const pool = getPool();
    const [rows] = await pool.query<Row[]>(`SELECT * FROM ${table} ORDER BY id ASC LIMIT 1`);
    return rows[0] ?? null;
  }

  getOrganization() {
    return this.getSingleton('organization_settings').then((r) => (r ? mapOrganization(r) : null));
  }

  async updateOrganization(dto: OrganizationSettingsDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE organization_settings SET
        legal_name = ?, dba_name = ?, tax_id = ?, address_line1 = ?, address_line2 = ?,
        city = ?, state = ?, postal_code = ?, country = ?, base_currency = ?, timezone = ?,
        primary_region = ?, public_profile_enabled = ?, payout_notifications_enabled = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.legalName, dto.dbaName ?? null, dto.taxId ?? null, dto.addressLine1 ?? null,
        dto.addressLine2 ?? null, dto.city ?? null, dto.state ?? null, dto.postalCode ?? null,
        dto.country ?? null, dto.baseCurrency, dto.timezone, dto.primaryRegion ?? null,
        dto.publicProfileEnabled ? 1 : 0, dto.payoutNotificationsEnabled ? 1 : 0, actorId ?? null,
      ],
    );
    return this.getOrganization();
  }

  getBranding() {
    return this.getSingleton('branding_settings').then((r) => (r ? mapBranding(r) : null));
  }

  async updateBranding(dto: BrandingSettingsDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE branding_settings SET
        company_name = ?, logo_url = ?, logo_initials = ?, primary_color = ?, secondary_color = ?,
        accent_color = ?, favicon_url = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.companyName, dto.logoUrl ?? null, dto.logoInitials ?? null, dto.primaryColor,
        dto.secondaryColor, dto.accentColor, dto.faviconUrl ?? null, actorId ?? null,
      ],
    );
    return this.getBranding();
  }

  getSecurity() {
    return this.getSingleton('security_settings').then((r) => (r ? mapSecurity(r) : null));
  }

  async updateSecurity(dto: SecuritySettingsDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE security_settings SET
        mfa_enforced = ?, mfa_methods_allowed = ?, ip_whitelist_enabled = ?, ip_whitelist = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.mfaEnforced ? 1 : 0, JSON.stringify(dto.mfaMethodsAllowed),
        dto.ipWhitelistEnabled ? 1 : 0, JSON.stringify(dto.ipWhitelist), actorId ?? null,
      ],
    );
    return this.getSecurity();
  }

  getPasswordPolicy() {
    return this.getSingleton('password_policy').then((r) => (r ? mapPasswordPolicy(r) : null));
  }

  async updatePasswordPolicy(dto: PasswordPolicyDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE password_policy SET
        min_length = ?, require_uppercase = ?, require_lowercase = ?, require_number = ?,
        require_special = ?, max_age_days = ?, history_count = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.minLength, dto.requireUppercase ? 1 : 0, dto.requireLowercase ? 1 : 0,
        dto.requireNumber ? 1 : 0, dto.requireSpecial ? 1 : 0, dto.maxAgeDays, dto.historyCount,
        actorId ?? null,
      ],
    );
    return this.getPasswordPolicy();
  }

  getSessionSettings() {
    return this.getSingleton('session_settings').then((r) => (r ? mapSession(r) : null));
  }

  async updateSessionSettings(dto: SessionSettingsDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE session_settings SET
        idle_timeout_minutes = ?, max_session_duration_minutes = ?, max_concurrent_sessions = ?,
        remember_device_days = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.idleTimeoutMinutes, dto.maxSessionDurationMinutes, dto.maxConcurrentSessions,
        dto.rememberDeviceDays, actorId ?? null,
      ],
    );
    return this.getSessionSettings();
  }

  getApiSettings() {
    return this.getSingleton('api_settings').then((r) => (r ? mapApi(r) : null));
  }

  async updateApiSettings(dto: ApiSettingsDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE api_settings SET
        api_base_url = ?, webhook_retry_count = ?, webhook_timeout_seconds = ?,
        rate_limit_per_minute = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.apiBaseUrl ?? null, dto.webhookRetryCount, dto.webhookTimeoutSeconds,
        dto.rateLimitPerMinute, actorId ?? null,
      ],
    );
    return this.getApiSettings();
  }

  getSmtpSettings() {
    return this.getSingleton('smtp_settings').then((r) => (r ? mapSmtp(r) : null));
  }

  async updateSmtpSettings(dto: SmtpSettingsDto, actorId?: number) {
    const pool = getPool();
    const updates: string[] = [
      'host = ?', 'port = ?', 'username = ?', 'from_email = ?', 'from_name = ?', 'use_tls = ?', 'updated_by = ?',
    ];
    const params: unknown[] = [
      dto.host ?? null, dto.port, dto.username ?? null, dto.fromEmail ?? null,
      dto.fromName ?? null, dto.useTls ? 1 : 0, actorId ?? null,
    ];
    if (dto.password) {
      const encrypted = encryptSecret(dto.password);
      updates.splice(3, 0, 'password_encrypted_v2 = ?');
      params.splice(3, 0, encrypted);
    }
    await getPool().query(`UPDATE smtp_settings SET ${updates.join(', ')} WHERE id = 1`, params);
    return this.getSmtpSettings();
  }

  getStorageSettings() {
    return this.getSingleton('storage_settings').then((r) => (r ? mapStorage(r) : null));
  }

  async updateStorageSettings(dto: StorageSettingsDto, actorId?: number) {
    const pool = getPool();
    await pool.query(
      `UPDATE storage_settings SET
        provider = ?, bucket_name = ?, region = ?, max_upload_mb = ?, allowed_extensions = ?, updated_by = ?
       WHERE id = 1`,
      [
        dto.provider, dto.bucketName ?? null, dto.region ?? null, dto.maxUploadMb,
        JSON.stringify(dto.allowedExtensions), actorId ?? null,
      ],
    );
    return this.getStorageSettings();
  }

  async getNotificationPreferences(userId: number | null) {
    const pool = getPool();
    const [rows] = await pool.query<Row[]>(
      'SELECT * FROM notification_preferences WHERE user_id <=> ? ORDER BY notification_type, channel',
      [userId],
    );
    return rows.map(mapNotificationPref);
  }

  async upsertNotificationPreferences(userId: number | null, dto: NotificationPreferencesBodyDto) {
    const pool = getPool();
    for (const pref of dto.preferences) {
      await pool.query(
        `INSERT INTO notification_preferences (uuid, user_id, notification_type, channel, is_enabled)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)`,
        [randomUUID(), userId, pref.notificationType, pref.channel, pref.isEnabled ? 1 : 0],
      );
    }
    return this.getNotificationPreferences(userId);
  }

  async findFeatureFlags(query: FeatureFlagListQueryDto) {
    const pool = getPool();
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (query.search) {
      conditions.push('(code LIKE ? OR name LIKE ? OR description LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term, term);
    }
    if (query.isEnabled !== undefined) {
      conditions.push('is_enabled = ?');
      params.push(query.isEnabled === 'true' ? 1 : 0);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await pool.query<Row[]>(
      `SELECT COUNT(*) AS total FROM feature_flags ${where}`,
      params,
    );
    const total = Number(countRows[0]?.['total'] ?? 0);
    const [rows] = await pool.query<Row[]>(
      `SELECT * FROM feature_flags ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows.map(mapFeatureFlag), total };
  }

  async findFeatureFlagById(id: number) {
    const pool = getPool();
    const [rows] = await pool.query<Row[]>('SELECT * FROM feature_flags WHERE id = ?', [id]);
    return rows[0] ? mapFeatureFlag(rows[0]) : null;
  }

  async findFeatureFlagByCode(code: string) {
    const pool = getPool();
    const [rows] = await pool.query<Row[]>('SELECT * FROM feature_flags WHERE code = ?', [code]);
    return rows[0] ? mapFeatureFlag(rows[0]) : null;
  }

  async createFeatureFlag(dto: CreateFeatureFlagBodyDto, actorId?: number) {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO feature_flags (uuid, code, name, description, is_enabled, is_beta, rollout_percentage, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), dto.code, dto.name, dto.description ?? null,
        dto.isEnabled ? 1 : 0, dto.isBeta ? 1 : 0, dto.rolloutPercentage, actorId ?? null,
      ],
    );
    return this.findFeatureFlagById(result.insertId);
  }

  async updateFeatureFlag(id: number, dto: UpdateFeatureFlagBodyDto, actorId?: number) {
    const pool = getPool();
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.name !== undefined) { fields.push('name = ?'); params.push(dto.name); }
    if (dto.description !== undefined) { fields.push('description = ?'); params.push(dto.description); }
    if (dto.isEnabled !== undefined) { fields.push('is_enabled = ?'); params.push(dto.isEnabled ? 1 : 0); }
    if (dto.isBeta !== undefined) { fields.push('is_beta = ?'); params.push(dto.isBeta ? 1 : 0); }
    if (dto.rolloutPercentage !== undefined) { fields.push('rollout_percentage = ?'); params.push(dto.rolloutPercentage); }
    if (!fields.length) return this.findFeatureFlagById(id);
    fields.push('updated_by = ?');
    params.push(actorId ?? null, id);
    await pool.query(`UPDATE feature_flags SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findFeatureFlagById(id);
  }

  async deleteFeatureFlag(id: number) {
    const pool = getPool();
    await pool.query('DELETE FROM feature_flags WHERE id = ?', [id]);
  }

  async getEnabledFeatureFlags() {
    const pool = getPool();
    const [rows] = await pool.query<Row[]>(
      'SELECT code, name, is_beta, rollout_percentage FROM feature_flags WHERE is_enabled = 1 ORDER BY name',
    );
    return rows.map((r) => ({
      code: r['code'] as string,
      name: r['name'] as string,
      isBeta: Boolean(r['is_beta']),
      rolloutPercentage: r['rollout_percentage'] as number,
    }));
  }

  async getOverview() {
    const [
      organization, branding, security, passwordPolicy, session, api, smtp, storage, featureFlags,
    ] = await Promise.all([
      this.getOrganization(),
      this.getBranding(),
      this.getSecurity(),
      this.getPasswordPolicy(),
      this.getSessionSettings(),
      this.getApiSettings(),
      this.getSmtpSettings(),
      this.getStorageSettings(),
      this.getEnabledFeatureFlags(),
    ]);
    return { organization, branding, security, passwordPolicy, session, api, smtp, storage, featureFlags };
  }

  async listRateLimits() {
    const orgId = getOrganizationId();
    if (!orgId) return [];
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM api_rate_limits WHERE organization_id = ? ORDER BY resource`, [orgId],
    );
    return rows.map((r) => ({
      id: r.id, organizationId: r.organization_id, resource: r.resource,
      limitPerMinute: r.limit_per_minute, limitPerDay: r.limit_per_day, updatedAt: r.updated_at,
    }));
  }

  async upsertRateLimit(resource: string, limitPerMinute: number, limitPerDay: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new Error('ORG_REQUIRED');
    const pool = getPool();
    await pool.query(
      `INSERT INTO api_rate_limits (organization_id, resource, limit_per_minute, limit_per_day)
       VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE limit_per_minute = VALUES(limit_per_minute), limit_per_day = VALUES(limit_per_day)`,
      [orgId, resource, limitPerMinute, limitPerDay],
    );
    return this.listRateLimits();
  }

  async updateGeoLogin(enabled: boolean, actorId?: number) {
    void actorId;
    const pool = getPool();
    await pool.query(`UPDATE security_settings SET geo_login_enabled = ? WHERE id = 1`, [enabled ? 1 : 0]);
    return this.getSecurity();
  }

  async updateApiIpRestrictions(ips: string[], actorId?: number) {
    void actorId;
    const pool = getPool();
    await pool.query(`UPDATE security_settings SET api_ip_restrictions = ? WHERE id = 1`, [JSON.stringify(ips)]);
    return this.getSecurity();
  }
}
