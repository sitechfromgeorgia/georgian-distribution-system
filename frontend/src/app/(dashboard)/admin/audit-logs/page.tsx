'use client'

import { useState, useEffect } from 'react'
import { AuditLogsTable } from '@/components/admin/AuditLogsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileText, Download, RefreshCw } from 'lucide-react'
import { AuditLogEntry } from '@/types/admin'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    criticalActions: 0
  })

  useEffect(() => {
    loadAuditLogs()
  }, [])

  async function loadAuditLogs() {
    try {
      setLoading(true)
      // In a real app, fetch from API
      // const data = await api.getAuditLogs()

      // Mock data for demonstration
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          action: 'user_create',
          resource: 'user',
          resource_id: 'u123',
          performed_by: 'admin@example.com',
          details: {
            user_email: 'newuser@example.com',
            role: 'restaurant'
          },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          action: 'product_update',
          resource: 'product',
          resource_id: 'p456',
          performed_by: 'admin@example.com',
          details: {
            changes: {
              price: { from: 10, to: 12 },
              name: { from: 'Old Name', to: 'New Name' }
            }
          },
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          action: 'order_status_change',
          resource: 'order',
          resource_id: 'o789',
          performed_by: 'admin@example.com',
          details: {
            old_status: 'pending',
            new_status: 'confirmed'
          },
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          action: 'user_delete',
          resource: 'user',
          resource_id: 'u999',
          performed_by: 'admin@example.com',
          details: {
            user_email: 'deleted@example.com',
            reason: 'Account closure requested'
          },
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '5',
          action: 'settings_update',
          resource: 'settings',
          performed_by: 'admin@example.com',
          details: {
            changes: {
              max_orders_per_day: { from: 50, to: 100 },
              auto_assign_drivers: { from: false, to: true }
            }
          },
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]

      setLogs(mockLogs)

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayCount = mockLogs.filter(log => new Date(log.created_at) >= today).length
      const criticalCount = mockLogs.filter(log =>
        log.action.includes('delete') ||
        log.action.includes('settings')
      ).length

      setStats({
        totalLogs: mockLogs.length,
        todayLogs: todayCount,
        criticalActions: criticalCount
      })
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast.error('აუდიტ ლოგების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportLogs() {
    try {
      // Convert logs to CSV
      const headers = ['თარიღი', 'მოქმედება', 'რესურსი', 'რესურსის ID', 'შემსრულებელი', 'დეტალები']
      const csvData = [
        headers.join(','),
        ...logs.map(log => [
          new Date(log.created_at).toLocaleString('ka-GE'),
          log.action,
          log.resource,
          log.resource_id || '',
          log.performed_by,
          JSON.stringify(log.details)
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('აუდიტ ლოგები წარმატებით ჩამოიტვირთა')
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error('ექსპორტი ვერ მოხერხდა')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">აუდიტ ლოგები</h1>
          <p className="text-muted-foreground">
            სისტემის ყველა მოქმედების დეტალური აღრიცხვა
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAuditLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            განახლება
          </Button>
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            ექსპორტი
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ ლოგები</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">
              ყველა აღრიცხული მოქმედება
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">დღეს</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLogs}</div>
            <p className="text-xs text-muted-foreground">
              დღევანდელი აქტივობები
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">კრიტიკული</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalActions}</div>
            <p className="text-xs text-muted-foreground">
              მნიშვნელოვანი ცვლილებები
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>აქტივობის ისტორია</CardTitle>
          <CardDescription>
            სისტემაში შესრულებული ყველა მოქმედების დეტალური ჩანაწერი
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsTable
            logs={logs}
            loading={loading}
            onExport={handleExportLogs}
          />
        </CardContent>
      </Card>
    </div>
  )
}
