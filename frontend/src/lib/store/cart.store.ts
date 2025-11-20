import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
    product_id: string
    name: string
    quantity: number
    unit: string
    price: number // Unit price
    image_url?: string
}

interface CartState {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    getTotalItems: () => number
    getTotalPrice: () => number
}

// Temporarily removed persist to debug
export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (newItem) => {
                set((state) => {
                    const existingItem = state.items.find(
                        (item) => item.product_id === newItem.product_id
                    )
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.product_id === newItem.product_id
                                    ? { ...item, quantity: item.quantity + newItem.quantity }
                                    : item
                            ),
                        }
                    }
                    return { items: [...state.items, newItem] }
                })
            },
            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.product_id !== productId),
                }))
            },
            updateQuantity: (productId, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.product_id === productId ? { ...item, quantity } : item
                    ),
                }))
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0)
            },
            getTotalPrice: () => {
                return get().items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                )
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') {
                    return localStorage
                }
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            }),
            skipHydration: true,
        }
    )
)
