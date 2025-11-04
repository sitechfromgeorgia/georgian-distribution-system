'use client'

import { useState, useEffect } from 'react'
import { UserTable } from '@/components/admin/UserTable'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Download, Upload } from 'lucide-react'
import { adminService } from '@/services/admin/admin.service'
import { User, UserFormData } from '@/types/admin'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    full_name: '',
    restaurant_name: '',
    phone: '',
    address: '',
    role: 'restaurant',
    is_active: true
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await adminService.getAllUsers()
      setUsers(data as User[])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('დაფიქსირდა შეცდომა მომხმარებლების ჩატვირთვისას')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUser() {
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await (await import('@/lib/supabase/client')).supabase.auth.signUp({
        email: formData.email,
        password: formData.password || 'TempPassword123!',
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role
          }
        }
      })

      if (authError) {
        throw authError
      }

      toast.success('მომხმარებელი წარმატებით შეიქმნა')
      setCreateDialogOpen(false)
      resetForm()
      await loadUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'მომხმარებლის შექმნა ვერ მოხერხდა')
    }
  }

  async function handleEditUser(user: User) {
    setSelectedUser(user)
    setFormData({
      email: user.email || '',
      full_name: user.full_name || '',
      restaurant_name: user.restaurant_name || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
      is_active: user.is_active
    })
    setEditDialogOpen(true)
  }

  async function handleUpdateUser() {
    if (!selectedUser) return

    try {
      await adminService.updateUserRole(selectedUser.id, formData.role)
      await adminService.updateUserStatus(selectedUser.id, formData.is_active)

      toast.success('მომხმარებელი წარმატებით განახლდა')
      setEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      await loadUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'მომხმარებლის განახლება ვერ მოხერხდა')
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await adminService.deleteUser(userId)
      toast.success('მომხმარებელი წარმატებით წაიშალა')
      await loadUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'მომხმარებლის წაშლა ვერ მოხერხდა')
    }
  }

  async function handleToggleStatus(userId: string, isActive: boolean) {
    try {
      await adminService.updateUserStatus(userId, isActive)
      toast.success(`მომხმარებელი ${isActive ? 'გააქტიურდა' : 'დეაქტივირდა'}`)
      await loadUsers()
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      toast.error(error.message || 'სტატუსის შეცვლა ვერ მოხერხდა')
    }
  }

  async function handleBulkAction(action: string, userIds: string[]) {
    try {
      switch (action) {
        case 'activate':
          for (const id of userIds) {
            await adminService.updateUserStatus(id, true)
          }
          toast.success(`${userIds.length} მომხმარებელი გააქტიურდა`)
          break
        case 'deactivate':
          for (const id of userIds) {
            await adminService.updateUserStatus(id, false)
          }
          toast.success(`${userIds.length} მომხმარებელი დეაქტივირდა`)
          break
        case 'export':
          await handleExportUsers()
          return
      }
      await loadUsers()
    } catch (error: any) {
      console.error('Error in bulk action:', error)
      toast.error(error.message || 'ბულკ ოპერაცია ვერ შესრულდა')
    }
  }

  async function handleExportUsers() {
    try {
      const csvData = await adminService.exportData('users')
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('მომხმარებლები წარმატებით ჩამოიტვირთა')
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('ექსპორტი ვერ მოხერხდა')
    }
  }

  function resetForm() {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      restaurant_name: '',
      phone: '',
      address: '',
      role: 'restaurant',
      is_active: true
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">მომხმარებლების მართვა</h1>
          <p className="text-muted-foreground">
            მართეთ სისტემის მომხმარებლები, როლები და უფლებები
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="mr-2 h-4 w-4" />
            ექსპორტი
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            ახალი მომხმარებელი
          </Button>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        loading={loading}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
        onBulkAction={handleBulkAction}
      />

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ახალი მომხმარებელი</DialogTitle>
            <DialogDescription>
              შექმენით ახალი მომხმარებელი სისტემაში
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">ელ. ფოსტა *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">პაროლი *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">სახელი და გვარი *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="გიორგი მელაძე"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">ტელეფონი</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+995 555 123 456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">როლი *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ადმინისტრატორი</SelectItem>
                    <SelectItem value="restaurant">რესტორანი</SelectItem>
                    <SelectItem value="driver">მძღოლი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">რესტორნის სახელი</Label>
                <Input
                  id="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  placeholder="სოფლის სახლი"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">მისამართი</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="თბილისი, ვაჟა-ფშაველა 25"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false)
              resetForm()
            }}>
              გაუქმება
            </Button>
            <Button onClick={handleCreateUser}>
              შექმნა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>მომხმარებლის რედაქტირება</DialogTitle>
            <DialogDescription>
              განაახლეთ მომხმარებლის ინფორმაცია
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_role">როლი</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ადმინისტრატორი</SelectItem>
                    <SelectItem value="restaurant">რესტორანი</SelectItem>
                    <SelectItem value="driver">მძღოლი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">სტატუსი</Label>
                <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">აქტიური</SelectItem>
                    <SelectItem value="inactive">არააქტიური</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false)
              setSelectedUser(null)
              resetForm()
            }}>
              გაუქმება
            </Button>
            <Button onClick={handleUpdateUser}>
              განახლება
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
