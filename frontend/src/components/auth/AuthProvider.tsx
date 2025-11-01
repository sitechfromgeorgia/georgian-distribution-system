'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Loader2 } from 'lucide-react'

interface AuthContextType {
  user: any
  profile: any
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: () => boolean
  isRestaurant: () => boolean
  isDriver: () => boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children?: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname()
  const {
    user,
    profile,
    loading,
    signOut,
    isAdmin,
    isRestaurant,
    isDriver,
    isAuthenticated
  } = useAuth()

  // Allow public access to certain routes
  const publicRoutes = ['/', '/welcome', '/demo', '/landing', '/login']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api')

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">მიმდინარეობს ავტორიზაცია...</p>
        </div>
      </div>
    )
  }

  // For non-public routes, require authentication
  if (!isPublicRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      isAdmin,
      isRestaurant,
      isDriver,
      isAuthenticated
    }}>
      {children}
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