'use client';
import { usePageTitle } from '@/app/hooks/usePageTitle';

import { useWishlist } from '@/app/hooks/useWishlist';
import ProductCard from '@/app/(user)/shared/shop-components/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
  usePageTitle('Wishlist', 'Your saved items');
  const { items } = useWishlist();

  // Filter items: only show available, visible products
  const visibleItems = items.filter(item => 
    item && 
    item.productId && 
    item.availability !== false && 
    item.visible !== false
  );

  return (
    <div className="min-h-screen bg-white pt-8 md:pt-4 md:pb-1">
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-7 text-center">
          <h1 className="text-3xl font-outfit font-extrabold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-500 font-outfit">
            {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              You haven't added any items to your wishlist yet. Browse our shop and save your favorites!
            </p>
            <Link 
              href="/shop" 
              className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {visibleItems.map((item: any) => (
              <ProductCard 
                key={item.productId} 
                product={{
                    id: item.productId,
                    sku: item.sku || item.slug || '', // Fallback if old data
                    slug: item.slug || item.sku || '', // Ensure slug always has a value
                    name: item.name,
                    price: item.price,
                    brand: item.brand || 'UPUL INT', // Fallback
                    images: [{ url: item.image }],
                    discountType: item.discountType || 'NONE',
                    discountValue: item.discountValue || 0,
                    availability: item.availability ?? true
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}