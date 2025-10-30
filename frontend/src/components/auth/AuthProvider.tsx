'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCSRF } from '@/hooks/useCSRF'
import { SessionTimeoutModal, useSessionTimeout } from './SessionTimeoutModal'
import { LoginForm } from './LoginForm'

const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null)
const CSRFContext = createContext<ReturnType<typeof useCSRF> | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()
  const csrf = useCSRF()
  const sessionTimeout = useSessionTimeout()
  const { user, loading } = auth

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>იტვირთება...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={auth}>
      <CSRFContext.Provider value={csrf}>
        {children}
        <SessionTimeoutModal
          isOpen={sessionTimeout.showModal}
          onExtend={sessionTimeout.extendSession}
          onSignOut={sessionTimeout.handleSignOut}
          timeRemaining={sessionTimeout.timeRemaining}
        />
      </CSRFContext.Provider>
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

export function useCSRFContext() {
  const context = useContext(CSRFContext)
  if (!context) {
    throw new Error('useCSRFContext must be used within AuthProvider')
  }
  return context
}