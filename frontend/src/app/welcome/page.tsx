'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Package, Database, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Georgian Distribution System
              </h1>
              <Badge>v2.0</Badge>
            </div>
            
            <Link href="/test">
              <Button variant="outline">Connection Test</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            B2B Food Distribution Platform
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            თანამედროვე პლატფორმა საქართველოში ფუდ დისტრიბუციისთვის
          </p>
          
          <div className="flex justify-center gap-4">
            <Link href="/test">
              <Button size="lg" className="gap-2">
                <Database className="h-5 w-5" />
                Test Connection
              </Button>
            </Link>
            <Button size="lg" variant="outline" disabled>
              Login (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle>Frontend Ready</CardTitle>
                  <CardDescription>Next.js 15 + TypeScript</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  React 19 + shadcn/ui
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Tailwind CSS
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Zustand + React Query
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <CardTitle>Backend Connected</CardTitle>
                  <CardDescription>Self-hosted Supabase</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  PostgreSQL 15+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  PostgREST API
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  VPS: data.greenland77.ge
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-500" />
                <div>
                  <CardTitle>Next Steps</CardTitle>
                  <CardDescription>Setup Required</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-500">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                  Create Database Schema
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                  Setup Authentication
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                  Configure RLS Policies
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Key Features
            </CardTitle>
            <CardDescription>
              რას შეიცავს Georgian Distribution System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">ადმინისტრატორი</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• მომხმარებლების მართვა</li>
                  <li>• პროდუქტების კატალოგი</li>
                  <li>• შეკვეთების კონტროლი</li>
                  <li>• ფასების დაყენება</li>
                  <li>• ანალიტიკა და რეპორტინგი</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">რესტორანი</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• ციფრული შეკვეთება</li>
                  <li>• Real-time სტატუსი</li>
                  <li>• შეკვეთების ისტორია</li>
                  <li>• ხარჯების თრექინგი</li>
                  <li>• ელექტრონული ინვოისები</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">მძღოლი</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• მიტანების სია</li>
                  <li>• სტატუსის განახლება</li>
                  <li>• მიტანის დადასტურება</li>
                  <li>• მობილური ინტერფეისი</li>
                  <li>• Real-time ნოტიფიკაციები</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Built with Next.js • TypeScript • Supabase • Tailwind CSS • shadcn/ui</p>
        </div>
      </main>
    </div>
  )
}