'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderHistoryTable } from '@/components/restaurant/OrderHistoryTable'
import { RestaurantOrder } from '@/types/restaurant'
import { RestaurantUtils } from '@/lib/restaurant-utils'

export default function OrderHistoryPage() {
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  const handleViewOrder = (order: RestaurantOrder) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const getStatusBadgeVariant = (status: RestaurantOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'preparing':
        return 'outline'
      case 'ready':
        return 'secondary'
      case 'out_for_delivery':
        return 'default'
      case 'delivered':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">შეკვეთების ისტორია</h1>
        <p className="text-muted-foreground">
          ყველა შეკვეთის დეტალური მიმოხილვა და ისტორია
        </p>
      </div>

      <OrderHistoryTable onViewOrder={handleViewOrder} />

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              შეკვეთა #{selectedOrder?.id.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              შეკვეთის დეტალური ინფორმაცია
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status and Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    სტატუსი
                  </label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    შექმნის დრო
                  </label>
                  <div className="mt-1">
                    {RestaurantUtils.formatDate(selectedOrder.created_at)}
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">მიწოდების ინფორმაცია</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      მისამართი
                    </label>
                    <p className="mt-1">{selectedOrder.delivery_address}</p>
                  </div>
                  {selectedOrder.delivery_time && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        სასურველი დრო
                      </label>
                      <p className="mt-1">
                        {RestaurantUtils.formatDate(selectedOrder.delivery_time)}
                      </p>
                    </div>
                  )}
                  {selectedOrder.driver_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        მძღოლი
                      </label>
                      <p className="mt-1">{selectedOrder.driver_name}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">შეკვეთის პროდუქტები</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{item.quantity} x {RestaurantUtils.formatCurrency(item.unit_price)}</span>
                          {item.notes && (
                            <span className="italic">"{item.notes}"</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {RestaurantUtils.formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">შეკვეთის რეზიუმე</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>პროდუქტები:</span>
                    <span>{selectedOrder.items.length} პროდუქტი</span>
                  </div>
                  <div className="flex justify-between">
                    <span>მიწოდების საფასური:</span>
                    <span>უფასო</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>სულ:</span>
                    <span>{RestaurantUtils.formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">სპეციალური ინსტრუქციები</h3>
                    <p className="text-muted-foreground">
                      {selectedOrder.special_instructions}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}