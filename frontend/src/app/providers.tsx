'use client'

import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default Providers
