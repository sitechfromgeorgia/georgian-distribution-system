export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'restaurant' | 'driver' | 'demo'
          full_name: string | null
          restaurant_name: string | null
          phone: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'restaurant' | 'driver' | 'demo'
          full_name?: string | null
          restaurant_name?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'restaurant' | 'driver' | 'demo'
          full_name?: string | null
          restaurant_name?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          cost_price: number
          category: string
          unit: string
          stock_quantity: number
          min_stock_level: number
          image_url: string | null
          tags: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          cost_price: number
          category: string
          unit: string
          stock_quantity: number
          min_stock_level: number
          image_url?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          cost_price?: number
          category?: string
          unit?: string
          stock_quantity?: number
          min_stock_level?: number
          image_url?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          driver_id: string | null
          status: 'pending' | 'confirmed' | 'priced' | 'assigned' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
          total_amount: number | null
          delivery_fee: number
          tax_amount: number
          discount_amount: number
          notes: string | null
          delivery_address: string | null
          delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          driver_id?: string | null
          status?: 'pending' | 'confirmed' | 'priced' | 'assigned' | 'out_for_delivery' | 'delivered' | 'completed'
          total_amount?: number | null
          delivery_fee?: number
          tax_amount?: number
          discount_amount?: number
          notes?: string | null
          delivery_address?: string | null
          delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          driver_id?: string | null
          status?: 'pending' | 'confirmed' | 'priced' | 'assigned' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
          total_amount?: number | null
          delivery_fee?: number
          tax_amount?: number
          discount_amount?: number
          notes?: string | null
          delivery_address?: string | null
          delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          cost_price: number | null
          selling_price: number | null
          total_price: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          cost_price?: number | null
          selling_price?: number | null
          total_price: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          cost_price?: number | null
          selling_price?: number | null
          total_price?: number
          notes?: string | null
          created_at?: string
        }
      }
      // Additional tables for real-time functionality
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
        }
      }
      // Demo data tables
      demo_sessions: {
        Row: {
          id: string
          session_id: string
          role: 'admin' | 'restaurant' | 'driver'
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          role: 'admin' | 'restaurant' | 'driver'
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'admin' | 'restaurant' | 'driver'
          started_at?: string
          ended_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'restaurant' | 'driver' | 'demo'
      order_status: 'pending' | 'confirmed' | 'priced' | 'assigned' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
      notification_type: 'info' | 'success' | 'warning' | 'error'
    }
  }
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Product = Tables<'products'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Notification = Tables<'notifications'>
export type DemoSession = Tables<'demo_sessions'>

export type ProfileInsert = Inserts<'profiles'>
export type ProductInsert = Inserts<'products'>
export type OrderInsert = Inserts<'orders'>
export type OrderItemInsert = Inserts<'order_items'>
export type NotificationInsert = Inserts<'notifications'>

export type ProfileUpdate = Updates<'profiles'>
export type ProductUpdate = Updates<'products'>
export type OrderUpdate = Updates<'orders'>
export type OrderItemUpdate = Updates<'order_items'>
export type NotificationUpdate = Updates<'notifications'>