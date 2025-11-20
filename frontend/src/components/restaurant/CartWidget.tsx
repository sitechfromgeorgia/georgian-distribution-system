'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart.store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CartWidget() {
    const { items, removeItem, updateQuantity, getTotalItems, clearCart } = useCartStore()
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [address, setAddress] = useState('')
    const [instructions, setInstructions] = useState('')
    const router = useRouter()

    const totalItems = getTotalItems()

    const handleSubmitOrder = async () => {
        if (!address) {
            toast.error('გთხოვთ მიუთითოთ მისამართი')
            return
        }

        if (items.length === 0) {
            toast.error('კალათა ცარიელია')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    delivery_address: address,
                    special_instructions: instructions,
                    items: items.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit: item.unit,
                    })),
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'შეკვეთის გაგზავნა ვერ მოხერხდა')
            }

            const order = await response.json()

            toast.success('შეკვეთა წარმატებით გაიგზავნა!')
            clearCart()
            setIsOpen(false)
            setAddress('')
            setInstructions('')

            // Redirect to order tracking (to be implemented)
            // router.push(`/restaurant/orders/${order.id}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'დაფიქსირდა შეცდომა')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                        >
                            {totalItems}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>კალათა ({totalItems} პროდუქტი)</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 pr-4">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-2 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 opacity-20" />
                            <p>კალათა ცარიელია</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {items.map((item) => (
                                <div key={item.product_id} className="flex items-center space-x-4">
                                    <div className="flex-1 space-y-1">
                                        <h4 className="text-sm font-medium leading-none">{item.name}</h4>
                                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => removeItem(item.product_id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <Separator />
                        <div className="space-y-2">
                            <Label htmlFor="address">მისამართი</Label>
                            <Input
                                id="address"
                                placeholder="მიწოდების მისამართი"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructions">კომენტარი</Label>
                            <Textarea
                                id="instructions"
                                placeholder="დამატებითი ინსტრუქციები..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                        </div>
                        <SheetFooter>
                            <Button
                                className="w-full"
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || !address}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                შეკვეთის გაგზავნა
                            </Button>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
