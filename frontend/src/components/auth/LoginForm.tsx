'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordResetForm } from './PasswordResetForm'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  if (showResetForm) {
    return <PasswordResetForm onBack={() => setShowResetForm(false)} />
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>რეგისტრაცია</CardTitle>
        <CardDescription>
          შეიყვანეთ თქვენი მონაცემები სისტემაში შესასვლელად
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">ელ. ფოსტა</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="password">პაროლი</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'მიმდინარეობს...' : 'შესვლა'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setShowResetForm(true)}
            className="text-sm"
          >
            დაგავიწყდათ პაროლი?
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}