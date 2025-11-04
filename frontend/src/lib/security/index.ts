/**
 * Security Module - Main Entry Point
 * Exports all security utilities and functions
 */

// Rate Limiting
export {
  RateLimiter,
  getRateLimiter,
  getRequestIdentifier,
  initializeRateLimiters,
  RateLimitPresets,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';

// CSRF Protection
export {
  generateCSRFToken,
  isValidCSRFTokenFormat,
  setCSRFCookie,
  getCSRFCookieToken,
  validateCSRFToken,
  clearCSRFCookie,
  refreshCSRFToken,
  requiresCSRFProtection,
  csrfMiddleware,
  CSRF_CONFIG,
  type CSRFTokenData,
} from './csrf-protection';

// Input Sanitization
export {
  InputSanitizer,
  batchSanitize,
  quickSanitize,
  type SanitizationOptions,
  type ValidationResult,
} from './input-sanitizer';

// Audit Logging
export {
  AuditLogger,
  cleanupOldAuditLogs,
  AuditEventType,
  AuditSeverity,
  type AuditEvent,
} from './audit-logger';

// API Key Management
export {
  APIKeyManager,
  authenticateAPIKey,
  requireScope,
  API_KEY_CONFIG,
  type APIKey,
  type APIKeyWithSecret,
} from './api-key-manager';

// Session Management
export {
  SessionManager,
  useSessionManager,
  initializeSessionManager,
  SESSION_CONFIG,
  type SessionState,
  type SessionWarning,
} from './session-manager';

// Re-export security utilities from main security file
export {
  AuthSecurity,
  OrderSecurity,
  InputSanitizer as LegacyInputSanitizer,
  SQLSecurity,
} from '../security';
