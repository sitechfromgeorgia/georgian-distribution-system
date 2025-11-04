/**
 * Enhanced Session Management with Timeout and Token Rotation
 * Implements secure session handling with automatic refresh and timeout
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { AuditLogger, AuditEventType } from './audit-logger';

// Session configuration
export const SESSION_CONFIG = {
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes of inactivity
  WARNING_BEFORE_TIMEOUT_MS: 5 * 60 * 1000, // Warn 5 minutes before timeout
  REFRESH_TOKEN_BEFORE_EXPIRY_MS: 10 * 60 * 1000, // Refresh 10 min before expiry
  MAX_SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours max session
  TOKEN_ROTATION_INTERVAL_MS: 60 * 60 * 1000, // Rotate token every hour
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'],
} as const;

export interface SessionState {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  tokenRefreshedAt: number;
  isActive: boolean;
  deviceId: string;
  ipAddress?: string;
}

export interface SessionWarning {
  timeoutIn: number; // milliseconds
  message: string;
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private static instance: SessionManager;
  private sessionState: SessionState | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;
  private onSessionWarningCallback: ((warning: SessionWarning) => void) | null = null;
  private isMonitoring: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session monitoring
   */
  async initialize(
    onExpired?: () => void,
    onWarning?: (warning: SessionWarning) => void
  ): Promise<void> {
    try {
      this.onSessionExpiredCallback = onExpired || null;
      this.onSessionWarningCallback = onWarning || null;

      // Get current session
      const supabase = createClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        logger.debug('No active session to monitor');
        return;
      }

      // Initialize session state
      const deviceId = this.getDeviceId();
      const now = Date.now();

      this.sessionState = {
        userId: session.user.id,
        email: session.user.email || '',
        role: (session.user.user_metadata?.role as string) || 'user',
        sessionId: this.generateSessionId(),
        createdAt: now,
        lastActivityAt: now,
        expiresAt: now + SESSION_CONFIG.MAX_SESSION_DURATION_MS,
        tokenRefreshedAt: now,
        isActive: true,
        deviceId,
      };

      // Start monitoring
      this.startMonitoring();

      logger.info('Session monitoring initialized', {
        userId: session.user.id,
        deviceId,
        expiresAt: new Date(this.sessionState.expiresAt),
      });
    } catch (error) {
      logger.error('Failed to initialize session manager', { error });
    }
  }

  /**
   * Start session monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring || !this.sessionState) {
      return;
    }

    this.isMonitoring = true;

    // Set up activity tracking
    this.setupActivityTracking();

    // Set up idle timeout check
    this.startIdleTimeoutCheck();

    // Set up token refresh
    this.startTokenRefresh();

    // Set up session expiry warning
    this.startExpiryWarning();
  }

  /**
   * Stop session monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    // Clear all timers
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Remove event listeners
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, this.handleActivity);
    });

    logger.debug('Session monitoring stopped');
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, this.handleActivity.bind(this), { passive: true });
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    if (!this.sessionState || !this.sessionState.isActive) {
      return;
    }

    const now = Date.now();
    this.sessionState.lastActivityAt = now;

    logger.debug('User activity detected', {
      lastActivityAt: new Date(now),
    });
  }

  /**
   * Start idle timeout check
   */
  private startIdleTimeoutCheck(): void {
    this.activityTimer = setInterval(async () => {
      if (!this.sessionState || !this.sessionState.isActive) {
        return;
      }

      const now = Date.now();
      const idleDuration = now - this.sessionState.lastActivityAt;

      // Check idle timeout
      if (idleDuration >= SESSION_CONFIG.IDLE_TIMEOUT_MS) {
        logger.warn('Session expired due to inactivity', {
          idleDuration: idleDuration / 1000 / 60,
          userId: this.sessionState.userId,
        });

        await this.expireSession('idle_timeout');
      }

      // Check max session duration
      if (now >= this.sessionState.expiresAt) {
        logger.warn('Session expired due to max duration', {
          userId: this.sessionState.userId,
        });

        await this.expireSession('max_duration');
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Start token refresh
   */
  private startTokenRefresh(): void {
    this.refreshTimer = setInterval(async () => {
      if (!this.sessionState || !this.sessionState.isActive) {
        return;
      }

      const now = Date.now();
      const timeSinceRefresh = now - this.sessionState.tokenRefreshedAt;

      // Refresh token if needed
      if (timeSinceRefresh >= SESSION_CONFIG.TOKEN_ROTATION_INTERVAL_MS) {
        await this.refreshToken();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Start expiry warning
   */
  private startExpiryWarning(): void {
    if (!this.sessionState) {
      return;
    }

    const warningTime =
      this.sessionState.expiresAt - SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MS;
    const timeUntilWarning = warningTime - Date.now();

    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        if (this.sessionState && this.sessionState.isActive && this.onSessionWarningCallback) {
          const timeoutIn = this.sessionState.expiresAt - Date.now();
          this.onSessionWarningCallback({
            timeoutIn,
            message: `Your session will expire in ${Math.ceil(timeoutIn / 1000 / 60)} minutes`,
          });
        }
      }, timeUntilWarning);
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<void> {
    try {
      const supabase = createClient();

      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('Token refresh failed', { error });
        await this.expireSession('refresh_failed');
        return;
      }

      if (!session) {
        logger.warn('No session after refresh');
        await this.expireSession('no_session');
        return;
      }

      if (this.sessionState) {
        this.sessionState.tokenRefreshedAt = Date.now();
      }

      logger.info('Session token refreshed', {
        userId: session.user.id,
        refreshedAt: new Date(),
      });

      // Audit log
      await AuditLogger.logAuth(
        AuditEventType.AUTH_SESSION_EXPIRED,
        session.user.id,
        true,
        { action: 'token_refreshed' }
      );
    } catch (error) {
      logger.error('Token refresh error', { error });
      await this.expireSession('refresh_error');
    }
  }

  /**
   * Expire the session
   */
  private async expireSession(reason: string): Promise<void> {
    if (!this.sessionState) {
      return;
    }

    const userId = this.sessionState.userId;

    this.sessionState.isActive = false;
    this.stopMonitoring();

    // Audit log
    await AuditLogger.logAuth(
      AuditEventType.AUTH_SESSION_EXPIRED,
      userId,
      true,
      { reason, expiredAt: new Date().toISOString() }
    );

    // Sign out
    const supabase = createClient();
    await supabase.auth.signOut();

    // Callback
    if (this.onSessionExpiredCallback) {
      this.onSessionExpiredCallback();
    }

    logger.info('Session expired', { userId, reason });
  }

  /**
   * Extend session (called when user is active)
   */
  async extendSession(): Promise<void> {
    if (!this.sessionState || !this.sessionState.isActive) {
      return;
    }

    const now = Date.now();
    this.sessionState.lastActivityAt = now;

    // Extend expiration
    const newExpiresAt = now + SESSION_CONFIG.IDLE_TIMEOUT_MS;
    if (newExpiresAt < this.sessionState.expiresAt) {
      this.sessionState.expiresAt = newExpiresAt;

      // Reset warning timer
      if (this.warningTimer) {
        clearTimeout(this.warningTimer);
      }
      this.startExpiryWarning();
    }

    logger.debug('Session extended', {
      expiresAt: new Date(this.sessionState.expiresAt),
    });
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState | null {
    return this.sessionState;
  }

  /**
   * Get time until timeout
   */
  getTimeUntilTimeout(): number {
    if (!this.sessionState || !this.sessionState.isActive) {
      return 0;
    }

    const now = Date.now();
    const idleTimeout = this.sessionState.lastActivityAt + SESSION_CONFIG.IDLE_TIMEOUT_MS;
    const maxTimeout = this.sessionState.expiresAt;

    return Math.min(idleTimeout - now, maxTimeout - now);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get or create device ID
   */
  private getDeviceId(): string {
    const key = 'session_device_id';
    let deviceId = localStorage.getItem(key);

    if (!deviceId) {
      deviceId = this.generateSessionId();
      localStorage.setItem(key, deviceId);
    }

    return deviceId;
  }

  /**
   * Manually end session
   */
  async endSession(): Promise<void> {
    await this.expireSession('manual_logout');
  }
}

/**
 * React hook for session management
 */
export function useSessionManager() {
  const manager = SessionManager.getInstance();

  const initializeSession = async (
    onExpired?: () => void,
    onWarning?: (warning: SessionWarning) => void
  ) => {
    await manager.initialize(onExpired, onWarning);
  };

  const extendSession = async () => {
    await manager.extendSession();
  };

  const endSession = async () => {
    await manager.endSession();
  };

  const getSessionState = () => {
    return manager.getSessionState();
  };

  const getTimeUntilTimeout = () => {
    return manager.getTimeUntilTimeout();
  };

  return {
    initializeSession,
    extendSession,
    endSession,
    getSessionState,
    getTimeUntilTimeout,
  };
}

/**
 * Initialize session manager on app start
 */
export function initializeSessionManager(
  onExpired?: () => void,
  onWarning?: (warning: SessionWarning) => void
): void {
  const manager = SessionManager.getInstance();
  manager.initialize(onExpired, onWarning);
}
