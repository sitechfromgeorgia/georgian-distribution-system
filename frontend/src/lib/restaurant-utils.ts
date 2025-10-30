import { createBrowserClient } from '@/lib/supabase/client'
import { RestaurantOrder, Product, CartItem, RestaurantMetrics, OrderFilters, ProductFilters } from '@/types/restaurant'

export class RestaurantUtils {
  static async getOrders(filters?: OrderFilters): Promise<RestaurantOrder[]> {
    const supabase = createBrowserClient()
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            unit
          )
        ),
        profiles!orders_driver_id_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end)
    }

    if (filters?.min_amount) {
      query = query.gte('total_amount', filters.min_amount)
    }

    if (filters?.max_amount) {
      query = query.lte('total_amount', filters.max_amount)
    }

    if (filters?.search) {
      query = query.ilike('delivery_address', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map(order => ({
      ...order,
      items: order.order_items || [],
      driver_name: order.profiles?.full_name
    })) as RestaurantOrder[]
  }

  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const supabase = createBrowserClient()
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('name')

    if (filters?.category?.length) {
      query = query.in('category', filters.category)
    }

    if (filters?.price_range) {
      query = query
        .gte('price', filters.price_range.min)
        .lte('price', filters.price_range.max)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.available_only !== undefined) {
      query = query.eq('is_available', filters.available_only)
    }

    const { data, error } = await query
    if (error) throw error

    return data as Product[]
  }

  static async createOrder(orderData: {
    items: CartItem[]
    delivery_address: string
    delivery_time?: string
    special_instructions?: string
  }): Promise<RestaurantOrder> {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    )

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: user.id,
        total_amount: totalAmount,
        delivery_address: orderData.delivery_address,
        delivery_time: orderData.delivery_time,
        notes: orderData.special_instructions,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      notes: item.notes
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return order as RestaurantOrder
  }

  static async updateOrderStatus(orderId: string, status: RestaurantOrder['status']): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) throw error
  }

  static async getRestaurantMetrics(): Promise<RestaurantMetrics> {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get orders for this restaurant
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          products (
            name
          )
        )
      `)
      .eq('restaurant_id', user.id)

    if (error) throw error

    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const completedOrders = orders.filter(o => ['delivered', 'completed'].includes(o.status)).length
    const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    // Calculate most ordered products
    const productCounts: Record<string, number> = {}
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown'
        productCounts[productName] = (productCounts[productName] || 0) + item.quantity
      })
    })

    const mostOrderedProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([product_name, quantity]) => ({ product_name, quantity }))

    // Delivery performance (mock data for now)
    const deliveryPerformance = {
      on_time_deliveries: Math.floor(completedOrders * 0.85),
      late_deliveries: Math.floor(completedOrders * 0.15),
      average_delivery_time: 45 // minutes
    }

    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      total_spent: totalSpent,
      average_order_value: averageOrderValue,
      most_ordered_products: mostOrderedProducts,
      delivery_performance: deliveryPerformance
    }
  }

  static async getCartFromStorage(): Promise<CartItem[]> {
    if (typeof window === 'undefined') return []

    try {
      const cartData = localStorage.getItem('restaurant_cart')
      return cartData ? JSON.parse(cartData) : []
    } catch {
      return []
    }
  }

  static async saveCartToStorage(cart: CartItem[]): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('restaurant_cart', JSON.stringify(cart))
    } catch (error) {
      console.error('Failed to save cart to storage:', error)
    }
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL'
    }).format(amount)
  }

  static formatDate(date: string): string {
    return new Intl.DateTimeFormat('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  static getStatusColor(status: RestaurantOrder['status']): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }
}