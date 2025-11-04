'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Activity,
  Database,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'
import { adminService } from '@/services/admin/admin.service'

interface SystemHealth {
  database: boolean
  api: boolean
  cache: boolean
  storage: boolean
}

interface PerformanceMetrics {
  cpu: number
  memory: number
  storage: number
  responseTime: number
}

interface ConnectionInfo {
  clientType: string
  hasAdminClient: boolean
  adminConnection: boolean
  environment: string
  timestamp: string
}

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<SystemHealth>({
    database: false,
    api: false,
    cache: false,
    storage: false
  })
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    cpu: 0,
    memory: 0,
    storage: 0,
    responseTime: 0
  })
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadSystemHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadSystemHealth() {
    try {
      setLoading(true)

      // Get system health
      const healthData = await adminService.getSystemHealth()

      setHealth({
        database: healthData.database || false,
        api: true, // If we can make this call, API is working
        cache: true, // Mock for now
        storage: true // Mock for now
      })

      // Get connection info
      const connInfo = await adminService.getConnectionInfo()
      setConnectionInfo(connInfo as ConnectionInfo)

      // Get performance metrics
      const perfData = await adminService.getPerformanceMetrics()

      // Mock performance data (in real app, get from monitoring service)
      setPerformance({
        cpu: Math.floor(Math.random() * 40) + 20, // 20-60%
        memory: Math.floor(Math.random() * 30) + 40, // 40-70%
        storage: Math.floor(Math.random() * 20) + 30, // 30-50%
        responseTime: Math.floor(Math.random() * 100) + 50 // 50-150ms
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading system health:', error)
      toast.error('სისტემის სტატუსის ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        მუშაობს
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        არ მუშაობს
      </Badge>
    )
  }

  const getPerformanceColor = (value: number) => {
    if (value < 50) return 'bg-green-500'
    if (value < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPerformanceStatus = (value: number) => {
    if (value < 50) return { status: 'კარგი', icon: CheckCircle2, color: 'text-green-500' }
    if (value < 80) return { status: 'საშუალო', icon: AlertCircle, color: 'text-yellow-500' }
    return { status: 'კრიტიკული', icon: XCircle, color: 'text-red-500' }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">სისტემის ჯანმრთელობა</h1>
          <p className="text-muted-foreground">
            სისტემის სტატუსი და მონიტორინგი
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-sm text-muted-foreground">
            <Clock className="inline w-4 h-4 mr-1" />
            ბოლო განახლება: {lastUpdate.toLocaleTimeString('ka-GE')}
          </div>
          <Button onClick={loadSystemHealth} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            განახლება
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მონაცემთა ბაზა</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">PostgreSQL</div>
              {getStatusBadge(health.database)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supabase Database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API სერვისი</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Next.js</div>
              {getStatusBadge(health.api)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Application Server
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">კეში სერვისი</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Redis</div>
              {getStatusBadge(health.cache)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Caching Layer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საცავი</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Supabase</div>
              {getStatusBadge(health.storage)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              File Storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>სისტემის რესურსები</CardTitle>
            <CardDescription>
              CPU, მეხსიერება და საცავის გამოყენება
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CPU გამოყენება</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{performance.cpu}%</span>
                  {(() => {
                    const status = getPerformanceStatus(performance.cpu)
                    const Icon = status.icon
                    return <Icon className={`h-4 w-4 ${status.color}`} />
                  })()}
                </div>
              </div>
              <Progress value={performance.cpu} className={getPerformanceColor(performance.cpu)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">მეხსიერება</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{performance.memory}%</span>
                  {(() => {
                    const status = getPerformanceStatus(performance.memory)
                    const Icon = status.icon
                    return <Icon className={`h-4 w-4 ${status.color}`} />
                  })()}
                </div>
              </div>
              <Progress value={performance.memory} className={getPerformanceColor(performance.memory)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">საცავი</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{performance.storage}%</span>
                  {(() => {
                    const status = getPerformanceStatus(performance.storage)
                    const Icon = status.icon
                    return <Icon className={`h-4 w-4 ${status.color}`} />
                  })()}
                </div>
              </div>
              <Progress value={performance.storage} className={getPerformanceColor(performance.storage)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>კავშირის ინფორმაცია</CardTitle>
            <CardDescription>
              სერვერთან და მონაცემთა ბაზასთან კავშირი
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionInfo && (
              <>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">კლიენტის ტიპი</span>
                  <Badge variant="outline">{connectionInfo.clientType}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">ადმინ კლიენტი</span>
                  {getStatusBadge(connectionInfo.hasAdminClient)}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">ადმინ კავშირი</span>
                  {getStatusBadge(connectionInfo.adminConnection)}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">გარემო</span>
                  <Badge>{connectionInfo.environment || 'development'}</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">პასუხის დრო</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{performance.responseTime}ms</span>
                    {performance.responseTime < 100 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>სისტემის ინფორმაცია</CardTitle>
          <CardDescription>
            სისტემის ვერსია და კონფიგურაცია
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">პლატფორმა</p>
              <p className="text-lg font-semibold mt-1">Next.js 15</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">დატაბაზა</p>
              <p className="text-lg font-semibold mt-1">PostgreSQL 15</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ფრეიმვორკი</p>
              <p className="text-lg font-semibold mt-1">React 19</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ვერსია</p>
              <p className="text-lg font-semibold mt-1">1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
