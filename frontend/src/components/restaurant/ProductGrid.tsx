'use client'

import { useState, useMemo } from 'react'
import { Product } from '@/lib/services/restaurant/product.service'
import { useCartStore } from '@/lib/store/cart.store'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

interface ProductGridProps {
    initialProducts: Product[]
    categories: string[]
}

export function ProductGrid({ initialProducts, categories }: ProductGridProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const { addItem } = useCartStore()

    const filteredProducts = useMemo(() => {
        return initialProducts.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [initialProducts, searchQuery, selectedCategory])

    const handleAddToCart = (product: Product) => {
        addItem({
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit: product.unit,
            price: 0, // Price is not visible/determined yet
            image_url: product.image_url
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                    <Input
                        placeholder="მოძებნეთ პროდუქტი..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="კატეგორია" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ყველა კატეგორია</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                    <Card key={product.id} className="flex flex-col overflow-hidden">
                        <div className="relative aspect-square w-full overflow-hidden bg-muted">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    სურათი არ არის
                                </div>
                            )}
                        </div>
                        <CardHeader className="p-4">
                            <div className="flex items-start justify-between">
                                <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
                                <Badge variant="secondary">{product.unit}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                        </CardHeader>
                        <CardFooter className="mt-auto p-4 pt-0">
                            <Button
                                className="w-full"
                                onClick={() => handleAddToCart(product)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                კალათაში დამატება
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-muted-foreground">პროდუქტები არ მოიძებნა</p>
                </div>
            )}
        </div>
    )
}
