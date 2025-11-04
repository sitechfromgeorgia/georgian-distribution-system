/**
 * Client-Side Security Hooks
 * React hooks for CSRF protection, input sanitization, and security features
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * CSRF Token Hook
 * Fetches and manages CSRF tokens for form submissions
 */
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCSRFToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/csrf', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setCSRFToken(data.token);
      logger.debug('CSRF token fetched successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to fetch CSRF token', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  /**
   * Refresh CSRF token
   */
  const refreshToken = useCallback(async () => {
    await fetchCSRFToken();
  }, [fetchCSRFToken]);

  /**
   * Get headers with CSRF token
   */
  const getCSRFHeaders = useCallback(() => {
    if (!csrfToken) {
      logger.warn('CSRF token not available');
      return {};
    }

    return {
      'x-csrf-token': csrfToken,
    };
  }, [csrfToken]);

  return {
    csrfToken,
    loading,
    error,
    refreshToken,
    getCSRFHeaders,
  };
}

/**
 * Input Sanitization Hook
 * Provides sanitization utilities for form inputs
 */
export function useInputSanitizer() {
  /**
   * Sanitize text input (remove HTML, trim, etc.)
   */
  const sanitizeText = useCallback((input: string, maxLength?: number): string => {
    if (!input) return '';

    let sanitized = input.trim();

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Encode special characters
    const charMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    sanitized = sanitized.replace(/[<>"'&]/g, (char) => charMap[char] || char);

    // Apply max length
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }, []);

  /**
   * Sanitize email input
   */
  const sanitizeEmail = useCallback((email: string): string => {
    return email.trim().toLowerCase().replace(/[<>"']/g, '');
  }, []);

  /**
   * Sanitize phone number
   */
  const sanitizePhone = useCallback((phone: string): string => {
    return phone.replace(/[^\d\s+()-]/g, '');
  }, []);

  /**
   * Sanitize numeric input
   */
  const sanitizeNumber = useCallback(
    (input: string | number, options?: { min?: number; max?: number }): number => {
      let value = typeof input === 'string' ? parseFloat(input) : input;

      if (isNaN(value)) {
        value = 0;
      }

      if (options?.min !== undefined && value < options.min) {
        value = options.min;
      }

      if (options?.max !== undefined && value > options.max) {
        value = options.max;
      }

      return value;
    },
    []
  );

  /**
   * Validate and sanitize URL
   */
  const sanitizeURL = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);

      // Only allow http and https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null;
      }

      return urlObj.toString();
    } catch {
      return null;
    }
  }, []);

  return {
    sanitizeText,
    sanitizeEmail,
    sanitizePhone,
    sanitizeNumber,
    sanitizeURL,
  };
}

/**
 * Secure API Request Hook
 * Provides secure fetch wrapper with CSRF, rate limiting awareness, etc.
 */
export function useSecureAPI() {
  const { csrfToken, getCSRFHeaders } = useCSRFToken();

  /**
   * Make a secure API request with CSRF protection
   */
  const secureRequest = useCallback(
    async <T = any>(
      url: string,
      options: RequestInit = {}
    ): Promise<{ data?: T; error?: string; status: number }> => {
      try {
        // Merge CSRF headers for mutation requests
        const method = options.method?.toUpperCase() || 'GET';
        const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        const headers = new Headers(options.headers);

        if (needsCSRF && csrfToken) {
          headers.set('x-csrf-token', csrfToken);
        }

        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          return {
            error: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
            status: 429,
          };
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: T | undefined;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        }

        if (!response.ok) {
          return {
            error: (data as any)?.error || 'Request failed',
            status: response.status,
          };
        }

        return {
          data,
          status: response.status,
        };
      } catch (error) {
        logger.error('Secure API request failed', { error, url });
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
        };
      }
    },
    [csrfToken]
  );

  /**
   * Convenience methods for common HTTP verbs
   */
  const get = useCallback(
    <T = any>(url: string) => secureRequest<T>(url, { method: 'GET' }),
    [secureRequest]
  );

  const post = useCallback(
    <T = any>(url: string, body: any) =>
      secureRequest<T>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    [secureRequest]
  );

  const put = useCallback(
    <T = any>(url: string, body: any) =>
      secureRequest<T>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    [secureRequest]
  );

  const patch = useCallback(
    <T = any>(url: string, body: any) =>
      secureRequest<T>(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    [secureRequest]
  );

  const del = useCallback(
    <T = any>(url: string) => secureRequest<T>(url, { method: 'DELETE' }),
    [secureRequest]
  );

  return {
    request: secureRequest,
    get,
    post,
    put,
    patch,
    delete: del,
    csrfToken,
    getCSRFHeaders,
  };
}

/**
 * Session Monitoring Hook
 * Monitors session timeout and provides warnings
 */
export function useSessionMonitor() {
  const [timeUntilTimeout, setTimeUntilTimeout] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check session activity every minute
    const interval = setInterval(() => {
      const lastActivity = localStorage.getItem('last_activity');
      if (!lastActivity) return;

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const idleTime = now - lastActivityTime;

      // 30 minutes timeout
      const TIMEOUT_MS = 30 * 60 * 1000;
      // 5 minutes warning
      const WARNING_MS = 5 * 60 * 1000;

      const timeRemaining = TIMEOUT_MS - idleTime;

      if (timeRemaining <= 0) {
        // Session expired
        setTimeUntilTimeout(0);
        setShowWarning(true);
      } else if (timeRemaining <= WARNING_MS) {
        // Show warning
        setTimeUntilTimeout(timeRemaining);
        setShowWarning(true);
      } else {
        setTimeUntilTimeout(timeRemaining);
        setShowWarning(false);
      }
    }, 60 * 1000); // Check every minute

    // Update activity on user interaction
    const updateActivity = () => {
      localStorage.setItem('last_activity', Date.now().toString());
      setShowWarning(false);
    };

    // Listen for activity events
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Initial activity update
    updateActivity();

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  return {
    timeUntilTimeout,
    showWarning,
  };
}

/**
 * Content Security Hook
 * Validates and sanitizes user-generated content
 */
export function useContentSecurity() {
  /**
   * Check if content contains potential XSS
   */
  const containsXSS = useCallback((content: string): boolean => {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(content));
  }, []);

  /**
   * Check if content contains potential SQL injection
   */
  const containsSQLInjection = useCallback((content: string): boolean => {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
      /(--|\*\/|\/\*)/,
      /(\bOR\b|\bAND\b)\s+['"]\d+['"]\s*=\s*['"]\d+['"]/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(content));
  }, []);

  /**
   * Validate content is safe
   */
  const isContentSafe = useCallback(
    (content: string): { safe: boolean; reason?: string } => {
      if (containsXSS(content)) {
        return { safe: false, reason: 'Potential XSS detected' };
      }

      if (containsSQLInjection(content)) {
        return { safe: false, reason: 'Potential SQL injection detected' };
      }

      return { safe: true };
    },
    [containsXSS, containsSQLInjection]
  );

  return {
    containsXSS,
    containsSQLInjection,
    isContentSafe,
  };
}
