import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

// Define types
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export type Product = Database['public']['Tables']['products']['Row']

// Service class for order management
export class OrderService {
  // Create a new order
  async createOrder(orderData: OrderInsert): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return null
    }

    return data
  }

  // Get orders for a restaurant
  async getRestaurantOrders(restaurantId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        driver:drivers(full_name, phone)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching restaurant orders:', error)
      return []
    }

    return data || []
  }

  // Get orders for a driver
  async getDriverOrders(driverId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        restaurant:restaurants(restaurant_name, phone)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching driver orders:', error)
      return []
    }

    return data || []
  }

  // Get all orders (admin)
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        restaurant:restaurants(restaurant_name, phone),
        driver:drivers(full_name, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all orders:', error)
      return []
    }

    return data || []
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return false
    }

    return true
  }

  // Assign driver to order
  async assignDriver(orderId: string, driverId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ driver_id: driverId })
      .eq('id', orderId)

    if (error) {
      console.error('Error assigning driver:', error)
      return false
    }

    return true
  }

  // Get order by ID with details
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        restaurant:restaurants(restaurant_name, phone),
        driver:drivers(full_name, phone)
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return null
    }

    return data
  }

  // Subscribe to real-time order updates
  subscribeToOrderUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        callback
      )
      .subscribe()

    return channel
  }

  // Subscribe to real-time order item updates
  subscribeToOrderItemUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('order-item-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        callback
      )
      .subscribe()

    return channel
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      console.error('Error cancelling order:', error)
      return false
    }

    return true
  }

  // Complete order
  async completeOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (error) {
      console.error('Error completing order:', error)
      return false
    }

    return true
  }

  // Add order item
  async addOrderItem(orderItem: OrderItemInsert): Promise<OrderItem | null> {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItem)
      .select()
      .single()

    if (error) {
      console.error('Error adding order item:', error)
      return null
    }

    return data
  }

  // Update order item
  async updateOrderItem(itemId: string, updates: Partial<OrderItem>): Promise<boolean> {
    const { error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', itemId)

    if (error) {
      console.error('Error updating order item:', error)
      return false
    }

    return true
  }

  // Delete order item
  async deleteOrderItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting order item:', error)
      return false
    }

    return true
  }

  // Get order items for an order
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(name, name_ka, price, unit)
      `)
      .eq('order_id', orderId)

    if (error) {
      console.error('Error fetching order items:', error)
      return []
    }

    return data || []
  }

  // Calculate order total
  async calculateOrderTotal(orderId: string): Promise<number> {
    const orderItems = await this.getOrderItems(orderId)
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Update order total
  async updateOrderTotal(orderId: string, total: number): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ total_amount: total })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order total:', error)
      return false
    }

    return true
  }

  // Get order history for a restaurant
  async getOrderHistory(restaurantId: string, limit: number = 50): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching order history:', error)
      return []
    }

    return data || []
  }

  // Get pending orders
  async getPendingOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(restaurant_name, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending orders:', error)
      return []
    }

    return data || []
  }

  // Confirm order
  async confirmOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)

    if (error) {
      console.error('Error confirming order:', error)
      return false
    }

    return true
  }

  // Price order
  async priceOrder(orderId: string, items: OrderItem[]): Promise<boolean> {
    // Update each item with pricing
    for (const item of items) {
      const { error } = await supabase
        .from('order_items')
        .update({
          price: item.price,
          total_price: item.price * item.quantity
        })
        .eq('id', item.id)

      if (error) {
        console.error('Error pricing order item:', error)
        return false
      }
    }

    // Update order status to priced
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'priced' })
      .eq('id', orderId)

    if (orderError) {
      console.error('Error pricing order:', orderError)
      return false
    }

    return true
  }
}