/**
 * Localization utilities for formatting dates, times, numbers, and currency
 * Optimized for Georgian (ka) and English (en) locales
 */

import { type Locale } from '@/i18n/config';

/**
 * Format date according to locale
 */
export function formatDate(date: Date | string | number, locale: Locale): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Format time according to locale
 */
export function formatTime(date: Date | string | number, locale: Locale): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format date and time according to locale
 */
export function formatDateTime(date: Date | string | number, locale: Locale): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format number according to locale
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-US').format(value);
}

/**
 * Format currency (Georgian Lari) according to locale
 */
export function formatCurrency(amount: number, locale: Locale): string {
  // Georgian Lari currency code is GEL
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    style: 'currency',
    currency: 'GEL',
    currencyDisplay: 'symbol',
  }).format(amount);
}

/**
 * Format currency with custom symbol (for display purposes)
 */
export function formatCurrencySimple(amount: number, locale: Locale): string {
  const formatted = formatNumber(amount, locale);
  return locale === 'ka' ? `${formatted} ₾` : `₾${formatted}`;
}

/**
 * Format percentage according to locale
 */
export function formatPercent(value: number, locale: Locale, decimals: number = 0): string {
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number, locale: Locale): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    numeric: 'auto',
  });

  // Define time units
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  // Find the appropriate unit
  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds) {
      const value = Math.floor(diffInSeconds / seconds);
      return rtf.format(-value, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Format phone number for Georgian format
 * Expected format: 5XXXXXXXX (9 digits)
 * Output: +995 5XX XX XX XX
 */
export function formatGeorgianPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it starts with 995 (country code)
  if (digits.startsWith('995')) {
    const number = digits.slice(3);
    if (number.length === 9) {
      return `+995 ${number.slice(0, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7)}`;
    }
  }

  // Assume it's a local number
  if (digits.length === 9) {
    return `+995 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }

  // Return as is if format doesn't match
  return phone;
}

/**
 * Parse Georgian phone number to standard format (without country code)
 */
export function parseGeorgianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Remove country code if present
  if (digits.startsWith('995')) {
    return digits.slice(3);
  }

  return digits;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number, locale: Locale): string {
  const units = locale === 'ka'
    ? ['ბაიტი', 'კბ', 'მბ', 'გბ', 'ტბ']
    : ['B', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) return `0 ${units[0]}`;

  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${formatNumber(Math.round(value * 100) / 100, locale)} ${units[i]}`;
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number, locale: Locale): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}${locale === 'ka' ? 'სთ' : 'h'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}${locale === 'ka' ? 'წთ' : 'm'}`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}${locale === 'ka' ? 'წმ' : 's'}`);
  }

  return parts.join(' ');
}
