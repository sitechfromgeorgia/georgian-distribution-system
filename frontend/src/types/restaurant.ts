export interface RestaurantOrder {
  id: string
  restaurant_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  total_amount: number
  items: OrderItem[]
  delivery_address: string
  delivery_time?: string
  special_instructions?: string
  created_at: string
  updated_at: string
  driver_id?: string
  driver_name?: string
  estimated_delivery_time?: string
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  unit: string
  min_order_quantity?: number
  max_order_quantity?: number
}

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

export interface RestaurantMetrics {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_spent: number
  average_order_value: number
  most_ordered_products: Array<{
    product_name: string
    quantity: number
  }>
  delivery_performance: {
    on_time_deliveries: number
    late_deliveries: number
    average_delivery_time: number
  }
}

export interface OrderFilters {
  status?: string[]
  date_range?: {
    start: string
    end: string
  }
  min_amount?: number
  max_amount?: number
  search?: string
}

export interface ProductFilters {
  category?: string[]
  price_range?: {
    min: number
    max: number
  }
  search?: string
  available_only?: boolean
}

export type OrderStatus = RestaurantOrder['status']

export const ORDER_STATUSES: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'მოლოდინში', color: 'yellow' },
  confirmed: { label: 'დადასტურებული', color: 'blue' },
  preparing: { label: 'მზადდება', color: 'orange' },
  ready: { label: 'მზადაა', color: 'green' },
  out_for_delivery: { label: 'გზაშია', color: 'purple' },
  delivered: { label: 'მიწოდებული', color: 'green' },
  cancelled: { label: 'გაუქმებული', color: 'red' }
}

export const PRODUCT_CATEGORIES = [
  'ხორცი და ფრინველი',
  'ბოსტნეული და ხილი',
  'საკონდიტრო',
  'სასმელები',
  'სანელებლები',
  'სხვა'
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]