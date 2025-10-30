/**
 * Comprehensive logging utilities for connection diagnostics
 */

export const logger = {
  // Info logs (normal operation)
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context)
    // Send to monitoring service in production
  },
  
  // Warning logs (recoverable issues)
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context)
    // Send to monitoring service
  },
  
  // Error logs (failures)
  error: (message: string, error: Error, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, { 
      error: error.message,
      stack: error.stack,
      ...context 
    })
    // Send to error tracking service (e.g., Sentry)
  },
  
  // Connection logs
  connection: (event: string, details: Record<string, unknown>) => {
    console.log(`[CONNECTION] ${event}`, details)
  },
  
  // Test logs
  test: (testName: string, result: 'PASS' | 'FAIL' | 'SKIP', details?: Record<string, unknown>) => {
    const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⏭️'
    console.log(`${icon} ${testName}: ${result}`, details)
  },
  
  // Performance logs
  performance: (operation: string, duration: number, metadata?: Record<string, unknown>) => {
    console.log(`⏱️ ${operation}: ${duration}ms`, metadata)
  }
}

// Usage examples:
// logger.info('VPS backend connection established', { backend: 'data.greenland77.ge' })
// logger.warn('Slow database query detected', { query: 'select * from orders', duration: 2500 })
// logger.error('Authentication failed', error, { email: 'user@example.com', attemptCount: 3 })
// logger.connection('WebSocket connected', { channel: 'orders', status: 'SUBSCRIBED' })
// logger.test('Database Connection', 'PASS', { latency: 120 })
// logger.performance('User Login', 1500, { method: 'password' })