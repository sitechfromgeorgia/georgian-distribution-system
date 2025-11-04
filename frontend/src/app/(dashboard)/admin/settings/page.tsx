'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Settings,
  Mail,
  Shield,
  Database,
  Bell,
  Globe,
  Truck,
  DollarSign,
  Save,
  RefreshCw
} from 'lucide-react'

interface SystemSettings {
  // General Settings
  siteName: string
  siteDescription: string
  supportEmail: string
  supportPhone: string
  timezone: string
  language: string
  currency: string

  // Order Settings
  autoAssignDrivers: boolean
  orderConfirmationRequired: boolean
  maxOrdersPerDay: number
  deliveryRadius: number
  minimumOrderAmount: number

  // Notification Settings
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  notifyOnNewOrder: boolean
  notifyOnOrderStatusChange: boolean
  notifyOnLowStock: boolean

  // Security Settings
  mfaRequired: boolean
  sessionTimeout: number
  passwordExpiryDays: number
  maxLoginAttempts: number
  ipWhitelist: string

  // Backup Settings
  autoBackup: boolean
  backupFrequency: string
  retentionDays: number
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    // General
    siteName: 'Georgian Distribution System',
    siteDescription: 'System for managing restaurant orders and deliveries',
    supportEmail: 'support@distribution.ge',
    supportPhone: '+995 555 123 456',
    timezone: 'Asia/Tbilisi',
    language: 'ka',
    currency: 'GEL',

    // Order
    autoAssignDrivers: false,
    orderConfirmationRequired: true,
    maxOrdersPerDay: 100,
    deliveryRadius: 50,
    minimumOrderAmount: 20,

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyOnNewOrder: true,
    notifyOnOrderStatusChange: true,
    notifyOnLowStock: true,

    // Security
    mfaRequired: false,
    sessionTimeout: 30,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    ipWhitelist: '',

    // Backup
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30
  })

  async function handleSaveSettings() {
    try {
      setLoading(true)
      // Save settings to database or API
      // await api.saveSystemSettings(settings)

      // For now, just save to localStorage as demonstration
      localStorage.setItem('system_settings', JSON.stringify(settings))

      toast.success('პარამეტრები წარმატებით შენახულია')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('პარამეტრების შენახვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSettings() {
    try {
      // Reset to defaults
      localStorage.removeItem('system_settings')
      // Reload settings
      toast.success('პარამეტრები დაბრუნდა საწყის მნიშვნელობებზე')
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('პარამეტრების  დაბრუნება ვერ მოხერხდა')
    }
  }

  useEffect(() => {
    // Load settings from localStorage on mount
    const saved = localStorage.getItem('system_settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">სისტემის პარამეტრები</h1>
          <p className="text-muted-foreground">
            მართეთ სისტემის კონფიგურაცია და პარამეტრები
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            გადატვირთვა
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            შენახვა
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            ზოგადი
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Truck className="mr-2 h-4 w-4" />
            შეკვეთები
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            შეტყობინებები
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            უსაფრთხოება
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="mr-2 h-4 w-4" />
            სარეზერვო კოპია
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ძირითადი პარამეტრები</CardTitle>
              <CardDescription>
                სისტემის ზოგადი ინფორმაცია და კონფიგურაცია
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">საიტის სახელი</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">მხარდაჭერის ელ. ფოსტა</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">აღწერა</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">ტელეფონი</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">დროის ზონა</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Tbilisi">Asia/Tbilisi (GMT+4)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">ვალუტა</Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GEL">GEL (₾)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Settings */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>შეკვეთების პარამეტრები</CardTitle>
              <CardDescription>
                შეკვეთების დამუშავების და მიწოდების კონფიგურაცია
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoAssignDrivers">ავტომატური მძღოლების მინიჭება</Label>
                  <p className="text-sm text-muted-foreground">
                    ახალ შეკვეთებს ავტომატურად მიენიჭოს თავისუფალი მძღოლები
                  </p>
                </div>
                <Switch
                  id="autoAssignDrivers"
                  checked={settings.autoAssignDrivers}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoAssignDrivers: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="orderConfirmationRequired">შეკვეთის დადასტურება სავალდებულოა</Label>
                  <p className="text-sm text-muted-foreground">
                    შეკვეთების დამუშავებამდე საჭიროა ადმინისტრატორის დადასტურება
                  </p>
                </div>
                <Switch
                  id="orderConfirmationRequired"
                  checked={settings.orderConfirmationRequired}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderConfirmationRequired: checked })}
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxOrdersPerDay">მაქს. შეკვეთები დღეში</Label>
                  <Input
                    id="maxOrdersPerDay"
                    type="number"
                    value={settings.maxOrdersPerDay}
                    onChange={(e) => setSettings({ ...settings, maxOrdersPerDay: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius">მიწოდების რადიუსი (კმ)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={settings.deliveryRadius}
                    onChange={(e) => setSettings({ ...settings, deliveryRadius: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderAmount">მინ. შეკვეთის ოდენობა (₾)</Label>
                  <Input
                    id="minimumOrderAmount"
                    type="number"
                    value={settings.minimumOrderAmount}
                    onChange={(e) => setSettings({ ...settings, minimumOrderAmount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>შეტყობინებების პარამეტრები</CardTitle>
              <CardDescription>
                მართეთ სისტემის შეტყობინებები და ალერტები
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">ელ. ფოსტის შეტყობინებები</Label>
                    <p className="text-sm text-muted-foreground">
                      გაგზავნეთ შეტყობინებები ელ. ფოსტის მეშვეობით
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smsNotifications">SMS შეტყობინებები</Label>
                    <p className="text-sm text-muted-foreground">
                      გაგზავნეთ შეტყობინებები SMS-ის მეშვეობით
                    </p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">Push შეტყობინებები</Label>
                    <p className="text-sm text-muted-foreground">
                      გაგზავნეთ Push შეტყობინებები ბრაუზერის მეშვეობით
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                  />
                </div>
              </div>
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">შეტყობინებების ტიპები</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyOnNewOrder">ახალი შეკვეთის შეტყობინება</Label>
                  <Switch
                    id="notifyOnNewOrder"
                    checked={settings.notifyOnNewOrder}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifyOnNewOrder: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyOnOrderStatusChange">შეკვეთის სტატუსის შეცვლის შეტყობინება</Label>
                  <Switch
                    id="notifyOnOrderStatusChange"
                    checked={settings.notifyOnOrderStatusChange}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifyOnOrderStatusChange: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyOnLowStock">დაბალი მარაგის შეტყობინება</Label>
                  <Switch
                    id="notifyOnLowStock"
                    checked={settings.notifyOnLowStock}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifyOnLowStock: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>უსაფრთხოების პარამეტრები</CardTitle>
              <CardDescription>
                მართეთ უსაფრთხოების პოლიტიკა და წვდომის კონტროლი
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mfaRequired">ორფაქტორიანი ავთენტიფიკაცია (MFA)</Label>
                  <p className="text-sm text-muted-foreground">
                    მოითხოვეთ MFA ყველა მომხმარებლისთვის
                  </p>
                </div>
                <Switch
                  id="mfaRequired"
                  checked={settings.mfaRequired}
                  onCheckedChange={(checked) => setSettings({ ...settings, mfaRequired: checked })}
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">სესიის ვადა (წუთი)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiryDays">პაროლის ვადა (დღე)</Label>
                  <Input
                    id="passwordExpiryDays"
                    type="number"
                    value={settings.passwordExpiryDays}
                    onChange={(e) => setSettings({ ...settings, passwordExpiryDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">მაქს. შესვლის მცდელობა</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP White List</Label>
                <Textarea
                  id="ipWhitelist"
                  value={settings.ipWhitelist}
                  onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                  placeholder="192.168.1.1&#10;10.0.0.1"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  ჩამოწერეთ IP მისამართები თითო ხაზზე. ცარიელი ველი დაუშვებს ყველა IP-ს.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>სარეზერვო კოპიის პარამეტრები</CardTitle>
              <CardDescription>
                მონაცემთა სარეზერვო კოპირების და აღდგენის კონფიგურაცია
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoBackup">ავტომატური სარეზერვო კოპირება</Label>
                  <p className="text-sm text-muted-foreground">
                    ავტომატურად შექმენით მონაცემთა სარეზერვო კოპიები
                  </p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">სიხშირე</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">ყოველ საათში</SelectItem>
                      <SelectItem value="daily">დღეში ერთხელ</SelectItem>
                      <SelectItem value="weekly">კვირაში ერთხელ</SelectItem>
                      <SelectItem value="monthly">თვეში ერთხელ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">შენახვის ვადა (დღე)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={settings.retentionDays}
                    onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  სარეზერვო კოპიის ახლა შექმნა
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
