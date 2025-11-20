import { Metadata } from 'next'
import { ProductService } from '@/lib/services/restaurant/product.service'
import { ProductGrid } from '@/components/restaurant/ProductGrid'
import { CartWidget } from '@/components/restaurant/CartWidget'

export const metadata: Metadata = {
    title: 'შეკვეთის გაფორმება | Georgian Distribution System',
    description: 'შეუკვეთეთ პროდუქტები დისტრიბუტორისგან',
}

export default async function OrderPage() {
    const products = await ProductService.getActiveProducts()
    const categories = await ProductService.getCategories()

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">შეკვეთის გაფორმება</h1>
                    <p className="text-muted-foreground">
                        აირჩიეთ პროდუქტები და დაამატეთ კალათაში
                    </p>
                </div>
                <CartWidget />
            </div>

            <ProductGrid initialProducts={products} categories={categories} />
        </div>
    )
}
