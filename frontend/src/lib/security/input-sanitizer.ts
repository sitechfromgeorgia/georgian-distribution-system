/**
 * Comprehensive Input Sanitization and Validation
 * Protects against XSS, SQL Injection, and other injection attacks
 */

import { logger } from '@/lib/logger';
import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowHTML?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  trim?: boolean;
  lowercase?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive input sanitizer class
 */
export class InputSanitizer {
  /**
   * Sanitize string input with XSS protection
   */
  static sanitizeString(
    input: string,
    options: SanitizationOptions = {}
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = input;

    // Trim whitespace
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    // Check max length
    if (options.maxLength && sanitized.length > options.maxLength) {
      errors.push(`Input exceeds maximum length of ${options.maxLength}`);
      sanitized = sanitized.substring(0, options.maxLength);
      warnings.push('Input truncated to maximum length');
    }

    // Detect potential SQL injection
    if (this.detectSQLInjection(sanitized)) {
      errors.push('Potential SQL injection detected');
      // Remove SQL keywords
      sanitized = this.removeSQLKeywords(sanitized);
      warnings.push('SQL keywords removed');
    }

    // XSS protection
    if (options.allowHTML) {
      // Allow HTML but sanitize it
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: options.allowedAttributes || { a: ['href', 'title'] },
      });
    } else {
      // Remove all HTML
      sanitized = this.stripHTML(sanitized);

      // Check for XSS patterns
      if (this.detectXSS(input)) {
        warnings.push('Potential XSS patterns detected and removed');
      }
    }

    // Lowercase if requested
    if (options.lowercase) {
      sanitized = sanitized.toLowerCase();
    }

    // Encode special characters
    sanitized = this.encodeSpecialChars(sanitized);

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(
    html: string,
    allowedTags?: string[],
    allowedAttributes?: Record<string, string[]>
  ): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags || [
        'b',
        'i',
        'em',
        'strong',
        'a',
        'p',
        'br',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ],
      ALLOWED_ATTR: allowedAttributes || {
        a: ['href', 'title', 'target'],
        img: ['src', 'alt'],
      },
    });
  }

  /**
   * Strip all HTML tags
   */
  static stripHTML(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): ValidationResult {
    const errors: string[] = [];
    let sanitized = email.trim().toLowerCase();

    // Basic email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Remove potential injection attempts
    sanitized = sanitized.replace(/[<>\"']/g, '');

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings: [],
    };
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    let sanitized = phone.trim();

    // Remove all non-numeric characters except + and spaces
    sanitized = sanitized.replace(/[^\d\s+()-]/g, '');

    // E.164 format validation (international standard)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = sanitized.replace(/[\s()-]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Invalid phone number format (use E.164: +[country][number])');
    }

    return {
      isValid: errors.length === 0,
      sanitized: cleanPhone,
      errors,
      warnings: [],
    };
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = url.trim();

    try {
      const urlObj = new URL(sanitized);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('Only HTTP and HTTPS protocols are allowed');
        sanitized = '';
      }

      // Check for javascript: protocol and other XSS vectors
      if (this.detectXSSInURL(sanitized)) {
        errors.push('Potential XSS detected in URL');
        sanitized = '';
      }
    } catch (error) {
      errors.push('Invalid URL format');
      sanitized = '';
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize UUID
   */
  static sanitizeUUID(uuid: string): ValidationResult {
    const errors: string[] = [];
    const sanitized = uuid.trim().toLowerCase();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(sanitized)) {
      errors.push('Invalid UUID format');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings: [],
    };
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(
    input: string | number,
    options: { min?: number; max?: number; integer?: boolean } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let sanitized = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(sanitized)) {
      errors.push('Invalid number format');
      sanitized = 0;
    }

    // Integer check
    if (options.integer && !Number.isInteger(sanitized)) {
      errors.push('Must be an integer');
      sanitized = Math.floor(sanitized);
      warnings.push('Value rounded to integer');
    }

    // Range checks
    if (options.min !== undefined && sanitized < options.min) {
      errors.push(`Value must be at least ${options.min}`);
      sanitized = options.min;
      warnings.push('Value clamped to minimum');
    }

    if (options.max !== undefined && sanitized > options.max) {
      errors.push(`Value must be at most ${options.max}`);
      sanitized = options.max;
      warnings.push('Value clamped to maximum');
    }

    return {
      isValid: errors.length === 0,
      sanitized: sanitized.toString(),
      errors,
      warnings,
    };
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJSON(input: string): ValidationResult {
    const errors: string[] = [];
    let sanitized = input.trim();

    try {
      const parsed = JSON.parse(sanitized);
      // Re-stringify to ensure clean JSON
      sanitized = JSON.stringify(parsed);
    } catch (error) {
      errors.push('Invalid JSON format');
      sanitized = '{}';
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings: [],
    };
  }

  /**
   * Detect SQL injection patterns
   */
  private static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(\bEXEC\b|\bEXECUTE\b|\bDECLARE\b)/i,
      /(--|\*\/|\/\*)/,
      /(\bOR\b|\bAND\b)\s+['"]\d+['"]\s*=\s*['"]\d+['"]/ i,
      /;[\s]*(\bDROP\b|\bDELETE\b|\bUPDATE\b)/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Remove SQL keywords
   */
  private static removeSQLKeywords(input: string): string {
    const keywords = [
      'UNION',
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'CREATE',
      'ALTER',
      'EXEC',
      'EXECUTE',
      'DECLARE',
      'GRANT',
      'REVOKE',
    ];

    let sanitized = input;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Remove SQL comments
    sanitized = sanitized.replace(/--.*$/gm, '');
    sanitized = sanitized.replace(/\/\*.*?\*\//gs, '');

    return sanitized;
  }

  /**
   * Detect XSS patterns
   */
  private static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Detect XSS in URL
   */
  private static detectXSSInURL(url: string): boolean {
    const xssPatterns = [
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+=/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Encode special characters
   */
  private static encodeSpecialChars(input: string): string {
    const charMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };

    return input.replace(/[<>"'&]/g, (char) => charMap[char] || char);
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(
    obj: any,
    options: SanitizationOptions = {}
  ): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj, options).sanitized;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key], options);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate and sanitize file upload
   */
  static validateFileUpload(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[]; // MIME types
      allowedExtensions?: string[];
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size exceeds maximum of ${options.maxSize} bytes`);
    }

    // Check MIME type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push(`File extension .${extension} is not allowed`);
      }
    }

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (sanitizedName !== file.name) {
      warnings.push('Filename sanitized');
    }

    return {
      isValid: errors.length === 0,
      sanitized: sanitizedName,
      errors,
      warnings,
    };
  }
}

/**
 * Batch sanitize multiple inputs
 */
export function batchSanitize(
  inputs: Record<string, string>,
  options: SanitizationOptions = {}
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [key, value] of Object.entries(inputs)) {
    results[key] = InputSanitizer.sanitizeString(value, options);
  }

  return results;
}

/**
 * Quick sanitization for common use cases
 */
export const quickSanitize = {
  text: (input: string, maxLength: number = 1000) =>
    InputSanitizer.sanitizeString(input, { maxLength, trim: true }).sanitized,

  email: (input: string) => InputSanitizer.sanitizeEmail(input).sanitized,

  phone: (input: string) => InputSanitizer.sanitizePhone(input).sanitized,

  url: (input: string) => InputSanitizer.sanitizeURL(input).sanitized,

  uuid: (input: string) => InputSanitizer.sanitizeUUID(input).sanitized,

  number: (input: string | number, min?: number, max?: number) =>
    parseFloat(InputSanitizer.sanitizeNumber(input, { min, max }).sanitized),

  html: (input: string) => InputSanitizer.sanitizeHTML(input),
};
