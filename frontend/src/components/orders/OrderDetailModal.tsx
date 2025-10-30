import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Clock, CheckCircle, Package, Truck, AlertCircle, User, MapPin, Phone, Mail } from 'lucide-react'

interface OrderDetailModalProps {
  order: any
  onClose: () => void
  userRole: string
}

export function OrderDetailModal({ order, onClose, userRole }: OrderDetailModalProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'confirmed': return 'default'
      case 'preparing': return 'default'
      case 'ready': return 'default'
      case 'in_delivery': return 'default'
      case 'delivered': return 'default'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'preparing': return <Package className="h-4 w-4" />
      case 'ready': return <Package className="h-4 w-4" />
      case 'in_delivery': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Order Details</span>
            <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="font-mono">#{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-xl font-bold">₾{order.total_price?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Restaurant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Restaurant</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium">{order.restaurant?.name}</p>
                    <p className="text-sm text-gray-600">{order.restaurant?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{order.restaurant?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Driver Information */}
          {order.driver && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Driver</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">{order.driver.full_name}</p>
                      <p className="text-sm text-gray-600">{order.driver.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Delivery</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="font-medium">{order.delivery_address}</p>
                </div>
              </div>
              {order.delivery_notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="text-sm">{order.delivery_notes}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Items</h3>
            <div className="border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Product</th>
                    <th className="text-center p-3">Quantity</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.product?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">₾{item.price?.toFixed(2)}</td>
                      <td className="text-right p-3 font-medium">
                        ₾{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {userRole === 'admin' && (
              <Button>
                Edit Order
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}