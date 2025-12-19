import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './cart.store'

describe('Cart Store', () => {
    beforeEach(() => {
        console.log('useCartStore:', useCartStore)
        console.log('window type:', typeof window)
        useCartStore.getState().clearCart()
    })

    it('should start with empty cart', () => {
        expect(useCartStore.getState().items).toHaveLength(0)
        expect(useCartStore.getState().getTotalItems()).toBe(0)
    })

    it('should add items to cart', () => {
        useCartStore.getState().addItem({
            product_id: '1',
            name: 'Test Product',
            quantity: 1,
            unit: 'kg',
            price: 10
        })

        expect(useCartStore.getState().items).toHaveLength(1)
        expect(useCartStore.getState().getTotalItems()).toBe(1)
    })

    it('should increment quantity for existing item', () => {
        useCartStore.getState().addItem({
            product_id: '1',
            name: 'Test Product',
            quantity: 1,
            unit: 'kg',
            price: 10
        })

        useCartStore.getState().addItem({
            product_id: '1',
            name: 'Test Product',
            quantity: 2,
            unit: 'kg',
            price: 10
        })

        expect(useCartStore.getState().items).toHaveLength(1)
        const item = useCartStore.getState().items[0]
        expect(item?.quantity).toBe(3)
    })

    it('should remove item from cart', () => {
        useCartStore.getState().addItem({
            product_id: '1',
            name: 'Test Product',
            quantity: 1,
            unit: 'kg',
            price: 10
        })

        useCartStore.getState().removeItem('1')
        expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('should update quantity', () => {
        useCartStore.getState().addItem({
            product_id: '1',
            name: 'Test Product',
            quantity: 1,
            unit: 'kg',
            price: 10
        })

        useCartStore.getState().updateQuantity('1', 5)
        const updatedItem = useCartStore.getState().items[0]
        expect(updatedItem?.quantity).toBe(5)
    })

    it('should calculate total price', () => {
        useCartStore.getState().addItem({
            product_id: '1',
            name: 'Product 1',
            quantity: 2,
            unit: 'kg',
            price: 10
        })

        useCartStore.getState().addItem({
            product_id: '2',
            name: 'Product 2',
            quantity: 1,
            unit: 'kg',
            price: 20
        })

        // (2 * 10) + (1 * 20) = 40
        expect(useCartStore.getState().getTotalPrice()).toBe(40)
    })
})
