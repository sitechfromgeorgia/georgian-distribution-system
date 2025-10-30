export const USER_ROLES = {
  ADMIN: 'admin',
  RESTAURANT: 'restaurant',
  DRIVER: 'driver'
} as const

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PRICED: 'priced',
  ASSIGNED: 'assigned',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const PRODUCT_CATEGORIES = [
  'ბოსტნეული',
  'ხილი',
  'ხორცი',
  'ზღვის პროდუქტები',
  'რძის პროდუქტები',
  'ცერეალები',
  'სანელებლები',
  'სასმელები',
  'სხვა'
] as const

export const UNITS = [
  'კგ',
  'ცალი',
  'ყუთი',
  'ლიტრი',
  'პაკეტი'
] as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES]
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
export type Unit = typeof UNITS[number]