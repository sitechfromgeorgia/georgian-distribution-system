/**
 * Comprehensive Audit Logging System for Security and Compliance
 * Tracks all sensitive operations and security events
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Audit event types
export enum AuditEventType {
  // Authentication
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_LOGIN_FAILED = 'auth.login_failed',
  AUTH_PASSWORD_RESET = 'auth.password_reset',
  AUTH_MFA_ENABLED = 'auth.mfa_enabled',
  AUTH_MFA_DISABLED = 'auth.mfa_disabled',
  AUTH_SESSION_EXPIRED = 'auth.session_expired',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_SUSPENDED = 'user.suspended',
  USER_REACTIVATED = 'user.reactivated',

  // Orders
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_DELETED = 'order.deleted',
  ORDER_STATUS_CHANGED = 'order.status_changed',

  // Products
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PRICE_CHANGED = 'product.price_changed',

  // API & Security
  API_KEY_CREATED = 'api.key_created',
  API_KEY_ROTATED = 'api.key_rotated',
  API_KEY_REVOKED = 'api.key_revoked',
  CSRF_VALIDATION_FAILED = 'security.csrf_failed',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  INVALID_INPUT = 'security.invalid_input',
  SQL_INJECTION_ATTEMPT = 'security.sql_injection_attempt',
  XSS_ATTEMPT = 'security.xss_attempt',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',

  // Data Access
  SENSITIVE_DATA_ACCESSED = 'data.sensitive_accessed',
  DATA_EXPORTED = 'data.exported',
  BULK_OPERATION = 'data.bulk_operation',

  // System
  SYSTEM_CONFIG_CHANGED = 'system.config_changed',
  BACKUP_CREATED = 'system.backup_created',
  MIGRATION_RUN = 'system.migration_run',
}

// Audit event severity levels
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Audit event interface
export interface AuditEvent {
  event_type: AuditEventType;
  severity: AuditSeverity;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string; // e.g., 'order', 'product', 'user'
  resource_id?: string;
  action: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  success: boolean;
  error_message?: string;
  timestamp: string;
  session_id?: string;
  request_id?: string;
}

// Audit logger class
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    try {
      const supabase = await createClient();

      const auditEvent: AuditEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      };

      // Log to database
      const { error } = await supabase.from('audit_logs').insert(auditEvent);

      if (error) {
        logger.error('Failed to insert audit log', { error, event: auditEvent });
        // Fall back to application logger
        logger.warn('Audit event (DB insert failed)', auditEvent);
      }

      // Also log to application logger for redundancy
      const logLevel = this.severityToLogLevel(event.severity);
      logger[logLevel](`Audit: ${event.event_type}`, {
        ...auditEvent,
        audit: true,
      });
    } catch (error) {
      logger.error('Audit logging failed', { error, event });
    }
  }

  /**
   * Log authentication event
   */
  static async logAuth(
    type: AuditEventType,
    userId?: string,
    success: boolean = true,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    const { ip_address, user_agent } = request ? this.extractRequestInfo(request) : {};

    await this.log({
      event_type: type,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      user_id: userId,
      action: type,
      details,
      success,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log user management event
   */
  static async logUserEvent(
    type: AuditEventType,
    userId: string,
    actorId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: type,
      severity: AuditSeverity.INFO,
      user_id: actorId,
      resource_type: 'user',
      resource_id: userId,
      action: type,
      details,
      success: true,
    });
  }

  /**
   * Log order event
   */
  static async logOrderEvent(
    type: AuditEventType,
    orderId: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: type,
      severity: AuditSeverity.INFO,
      user_id: userId,
      resource_type: 'order',
      resource_id: orderId,
      action: type,
      details,
      success: true,
    });
  }

  /**
   * Log product event
   */
  static async logProductEvent(
    type: AuditEventType,
    productId: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: type,
      severity: AuditSeverity.INFO,
      user_id: userId,
      resource_type: 'product',
      resource_id: productId,
      action: type,
      details,
      success: true,
    });
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    type: AuditEventType,
    request: Request,
    details?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const { ip_address, user_agent } = this.extractRequestInfo(request);

    await this.log({
      event_type: type,
      severity: this.getSecuritySeverity(type),
      user_id: userId,
      action: type,
      details,
      success: false,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log API key event
   */
  static async logAPIKeyEvent(
    type: AuditEventType,
    keyId: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: type,
      severity: AuditSeverity.WARNING,
      user_id: userId,
      resource_type: 'api_key',
      resource_id: keyId,
      action: type,
      details,
      success: true,
    });
  }

  /**
   * Log data access event
   */
  static async logDataAccess(
    type: AuditEventType,
    userId: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: type,
      severity: AuditSeverity.INFO,
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action: type,
      details,
      success: true,
    });
  }

  /**
   * Query audit logs
   */
  static async query(filters: {
    user_id?: string;
    event_type?: AuditEventType;
    severity?: AuditSeverity;
    resource_type?: string;
    resource_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      const supabase = await createClient();

      let query = supabase.from('audit_logs').select('*');

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }

      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      query = query.order('timestamp', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to query audit logs', { error, filters });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Audit log query failed', { error, filters });
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStatistics(
    startDate: string,
    endDate: string
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    securityEvents: number;
    authEvents: number;
  }> {
    try {
      const logs = await this.query({
        start_date: startDate,
        end_date: endDate,
        limit: 10000, // Reasonable limit for stats
      });

      const stats = {
        totalEvents: logs.length,
        eventsByType: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        securityEvents: 0,
        authEvents: 0,
      };

      logs.forEach((log) => {
        // Count by type
        stats.eventsByType[log.event_type] = (stats.eventsByType[log.event_type] || 0) + 1;

        // Count by severity
        stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;

        // Count security events
        if (log.event_type.startsWith('security.')) {
          stats.securityEvents++;
        }

        // Count auth events
        if (log.event_type.startsWith('auth.')) {
          stats.authEvents++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get audit log statistics', { error });
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        securityEvents: 0,
        authEvents: 0,
      };
    }
  }

  /**
   * Extract request information
   */
  private static extractRequestInfo(request: Request): {
    ip_address: string;
    user_agent: string;
  } {
    const ip_address =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const user_agent = request.headers.get('user-agent') || 'unknown';

    return { ip_address, user_agent };
  }

  /**
   * Map severity to log level
   */
  private static severityToLogLevel(severity: AuditSeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
      case AuditSeverity.INFO:
        return 'info';
      case AuditSeverity.WARNING:
        return 'warn';
      case AuditSeverity.ERROR:
      case AuditSeverity.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Get security event severity
   */
  private static getSecuritySeverity(type: AuditEventType): AuditSeverity {
    const criticalEvents = [
      AuditEventType.SQL_INJECTION_ATTEMPT,
      AuditEventType.UNAUTHORIZED_ACCESS,
    ];

    const errorEvents = [
      AuditEventType.XSS_ATTEMPT,
      AuditEventType.CSRF_VALIDATION_FAILED,
    ];

    if (criticalEvents.includes(type)) {
      return AuditSeverity.CRITICAL;
    }

    if (errorEvents.includes(type)) {
      return AuditSeverity.ERROR;
    }

    return AuditSeverity.WARNING;
  }
}

/**
 * Audit log retention policy (to be run periodically)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  try {
    const supabase = await createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { count, error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (error) {
      logger.error('Failed to cleanup old audit logs', { error });
      return 0;
    }

    logger.info(`Cleaned up ${count} old audit logs`, {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });

    return count || 0;
  } catch (error) {
    logger.error('Audit log cleanup failed', { error });
    return 0;
  }
}
