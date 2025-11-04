// Vitest setup file for Georgian Distribution System
// Sets up environment variables and global mocks for tests

import { vi } from 'vitest'

// Set default environment variables for tests
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
process.env.NEXT_PUBLIC_ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

// Mock console.error to reduce noise in tests (optional)
// You can remove this if you want to see all error logs
const originalError = console.error
console.error = vi.fn((...args) => {
  // Still log critical errors
  if (args[0]?.includes?.('Critical') || args[0]?.includes?.('Fatal')) {
    originalError(...args)
  }
  // Suppress other errors in test output
})

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})
