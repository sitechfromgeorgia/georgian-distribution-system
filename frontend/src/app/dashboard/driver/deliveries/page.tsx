'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Truck,
  Search,
  Filter,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
  Package,
  Navigation,
  Camera,
  MessageSquare
} from 'lucide-react'
import { DELIVERY_STATUSES, DriverDelivery } from '@/types/driver'

interface DeliveryCardProps {
  delivery: DriverDelivery
  onAction: (action: string, deliveryId: string) => void
}

function DeliveryCard({ delivery, onAction }: DeliveryCardProps) {
  const statusInfo = DELIVERY_STATUSES[delivery.status]

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>{statusInfo.icon}</span>
              <span>{statusInfo.label}</span>
            </Badge>
            <span className="font-semibold">#{delivery.order_id}</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">₾{delivery.order?.total_amount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">+₾{delivery.delivery_fee || '3.00'} მიწოდება</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Delivery Address */}
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{delivery.delivery_address}</p>
            {delivery.delivery_coordinates && (
              <p className="text-sm text-muted-foreground">
                {delivery.delivery_coordinates.latitude.toFixed(4)}, {delivery.delivery_coordinates.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        {delivery.customer_name && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {delivery.customer_name[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium">{delivery.customer_name}</p>
              {delivery.customer_phone && (
                <p className="text-sm text-muted-foreground">{delivery.customer_phone}</p>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-1" />
              დარეკვა
            </Button>
          </div>
        )}

        {/* Order Items */}
        {delivery.order?.items && (
          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="font-medium mb-2 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              შეკვეთის დეტალები
            </h4>
            <div className="space-y-1">
              {delivery.order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.product_name}</span>
                  <span>{item.quantity} {item.unit}</span>
                </div>
              ))}
              {delivery.order.items.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{delivery.order.items.length - 3} სხვა პროდუქტი
                </p>
              )}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {delivery.special_instructions && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              სპეციალური ინსტრუქციები
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {delivery.special_instructions}
            </p>
          </div>
        )}

        {/* Time Information */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>მოსალოდნელი: {delivery.estimated_delivery_time}</span>
            </div>
            {delivery.distance_km && (
              <div className="flex items-center space-x-1">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span>{delivery.distance_km.toFixed(1)} კმ</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {delivery.status === 'assigned' && (
            <>
              <Button
                onClick={() => onAction('pickup', delivery.id)}
                className="flex-1 sm:flex-none"
              >
                <Package className="h-4 w-4 mr-2" />
                აღება
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction('navigate', delivery.id)}
                className="flex-1 sm:flex-none"
              >
                <Navigation className="h-4 w-4 mr-2" />
                ნავიგაცია
              </Button>
            </>
          )}

          {delivery.status === 'picked_up' && (
            <>
              <Button
                onClick={() => onAction('start_delivery', delivery.id)}
                className="flex-1 sm:flex-none"
              >
                <Truck className="h-4 w-4 mr-2" />
                დაწყება
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction('navigate', delivery.id)}
                className="flex-1 sm:flex-none"
              >
                <Navigation className="h-4 w-4 mr-2" />
                ნავიგაცია
              </Button>
            </>
          )}

          {delivery.status === 'in_transit' && (
            <>
              <Button
                onClick={() => onAction('deliver', delivery.id)}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                მიწოდება
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction('contact_customer', delivery.id)}
                className="flex-1 sm:flex-none"
              >
                <Phone className="h-4 w-4 mr-2" />
                დაკავშირება
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => onAction('message', delivery.id)}
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DriverDelivery[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('active')

  // Mock data - replace with actual API calls
  const loadDeliveries = async () => {
    const mockDeliveries: DriverDelivery[] = [
      {
        id: '1',
        order_id: 'ORD-001',
        driver_id: 'driver-1',
        status: 'assigned',
        pickup_time: undefined,
        delivery_time: undefined,
        estimated_delivery_time: '14:30',
        delivery_address: 'თბილისი, რუსთაველის გამზირი 10',
        delivery_coordinates: { latitude: 41.7167, longitude: 44.7833 },
        customer_name: 'გიორგი მ.',
        customer_phone: '+995 555 123 456',
        special_instructions: 'შემოვიდეთ უკანა კარიდან',
        delivery_fee: 3.00,
        distance_km: 2.5,
        estimated_duration_minutes: 25,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        order: {
          id: 'ORD-001',
          restaurant_name: 'სამზარეულო #1',
          total_amount: 25.00,
          items: [
            { product_name: 'ხორცი', quantity: 2, unit: 'კგ' },
            { product_name: 'ბოსტნეული', quantity: 1, unit: 'კგ' }
          ]
        }
      },
      {
        id: '2',
        order_id: 'ORD-002',
        driver_id: 'driver-1',
        status: 'in_transit',
        pickup_time: '2024-01-15T13:15:00Z',
        delivery_time: undefined,
        estimated_delivery_time: '15:00',
        delivery_address: 'თბილისი, მარჯანიშვილის ქუჩა 15',
        delivery_coordinates: { latitude: 41.7267, longitude: 44.7933 },
        customer_name: 'მარიამ კ.',
        customer_phone: '+995 555 987 654',
        delivery_fee: 3.00,
        distance_km: 3.2,
        estimated_duration_minutes: 30,
        created_at: '2024-01-15T12:30:00Z',
        updated_at: '2024-01-15T13:15:00Z',
        order: {
          id: 'ORD-002',
          restaurant_name: 'სამზარეულო #2',
          total_amount: 18.50,
          items: [
            { product_name: 'სასმელი', quantity: 6, unit: 'ლ' },
            { product_name: 'ხილი', quantity: 3, unit: 'კგ' }
          ]
        }
      }
    ]

    setDeliveries(mockDeliveries)
  }

  useEffect(() => {
    loadDeliveries()
  }, [])

  // Filter deliveries based on search and status
  const updateFilteredDeliveries = () => {
    let filtered = deliveries

    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter)
    }

    setFilteredDeliveries(filtered)
  }

  useEffect(() => {
    updateFilteredDeliveries()
  }, [deliveries, searchTerm, statusFilter])

  const handleDeliveryAction = (action: string, deliveryId: string) => {
    console.log(`Action: ${action} for delivery: ${deliveryId}`)
    // Implement action handlers
  }

  const activeDeliveries = filteredDeliveries.filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status))
  const completedDeliveries = filteredDeliveries.filter(d => d.status === 'delivered')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">მიწოდებები</h1>
          <p className="text-muted-foreground">
            მართეთ თქვენი მიწოდებები და ტრეკინგი
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძებნა შეკვეთის ID, მისამართი ან მომხმარებელი..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="სტატუსი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა სტატუსი</SelectItem>
                {Object.entries(DELIVERY_STATUSES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>აქტიური ({activeDeliveries.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>დასრულებული ({completedDeliveries.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeDeliveries.length > 0 ? (
            activeDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onAction={handleDeliveryAction}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">აქტიური მიწოდებები არ არის</h3>
                <p className="text-muted-foreground text-center">
                  თქვენი აქტიური მიწოდებები გამოჩნდება აქ
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedDeliveries.length > 0 ? (
            completedDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onAction={handleDeliveryAction}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">დასრულებული მიწოდებები არ არის</h3>
                <p className="text-muted-foreground text-center">
                  თქვენი დასრულებული მიწოდებები გამოჩნდება აქ
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}