'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Filter,
  Download,
  Eye,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  ShoppingCart,
  Package,
  Settings,
  Shield
} from 'lucide-react'
import { AuditLogEntry } from '@/types/admin'

interface AuditLogsTableProps {
  logs: AuditLogEntry[]
  loading?: boolean
  onExport: () => void
}

export function AuditLogsTable({
  logs,
  loading = false,
  onExport
}: AuditLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performed_by.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter)
      const matchesResource = resourceFilter === 'all' || log.resource === resourceFilter

      return matchesSearch && matchesAction && matchesResource
    })
  }, [logs, searchTerm, actionFilter, resourceFilter])

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <UserPlus className="w-4 h-4" />
    if (action.includes('delete')) return <Trash2 className="w-4 h-4" />
    if (action.includes('update')) return <Edit className="w-4 h-4" />
    if (action.includes('order')) return <ShoppingCart className="w-4 h-4" />
    if (action.includes('product')) return <Package className="w-4 h-4" />
    if (action.includes('settings')) return <Settings className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const getActionBadge = (action: string) => {
    if (action.includes('create')) {
      return <Badge variant="default" className="bg-green-500">შექმნა</Badge>
    }
    if (action.includes('delete')) {
      return <Badge variant="destructive">წაშლა</Badge>
    }
    if (action.includes('update')) {
      return <Badge variant="secondary">განახლება</Badge>
    }
    return <Badge variant="outline">{action}</Badge>
  }

  const getResourceBadge = (resource: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-500',
      product: 'bg-purple-500',
      order: 'bg-orange-500',
      settings: 'bg-gray-500',
      system: 'bg-red-500'
    }

    return (
      <Badge className={colors[resource] || 'bg-gray-500'}>
        {resource}
      </Badge>
    )
  }

  const viewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log)
    setDetailsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-64"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="ძიება აქტივობების მიხედვით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="მოქმედება" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა მოქმედება</SelectItem>
              <SelectItem value="create">შექმნა</SelectItem>
              <SelectItem value="update">განახლება</SelectItem>
              <SelectItem value="delete">წაშლა</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="რესურსი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა რესურსი</SelectItem>
              <SelectItem value="user">მომხმარებლები</SelectItem>
              <SelectItem value="product">პროდუქტები</SelectItem>
              <SelectItem value="order">შეკვეთები</SelectItem>
              <SelectItem value="settings">პარამეტრები</SelectItem>
              <SelectItem value="system">სისტემა</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          ექსპორტი
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>მოქმედება</TableHead>
              <TableHead>რესურსი</TableHead>
              <TableHead>შემსრულებელი</TableHead>
              <TableHead>თარიღი</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  აუდიტ ლოგები არ მოიძებნა
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getActionIcon(log.action)}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell>
                    {getResourceBadge(log.resource)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.performed_by}
                  </TableCell>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString('ka-GE')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewDetails(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>აუდიტ ლოგის დეტალები</DialogTitle>
            <DialogDescription>
              დეტალური ინფორმაცია შესრულებული მოქმედების შესახებ
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">მოქმედება</p>
                  <p className="text-sm font-medium mt-1">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">რესურსი</p>
                  <p className="text-sm font-medium mt-1">{selectedLog.resource}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">შემსრულებელი</p>
                  <p className="text-sm font-medium mt-1">{selectedLog.performed_by}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">თარიღი</p>
                  <p className="text-sm font-medium mt-1">
                    {new Date(selectedLog.created_at).toLocaleString('ka-GE')}
                  </p>
                </div>
              </div>
              {selectedLog.resource_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">რესურსის ID</p>
                  <p className="text-sm font-medium mt-1 font-mono">{selectedLog.resource_id}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">დეტალები</p>
                <pre className="text-xs mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-64">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
