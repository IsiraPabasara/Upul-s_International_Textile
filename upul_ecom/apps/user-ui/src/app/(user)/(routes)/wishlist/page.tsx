'use client';

import { useWishlist } from '@/app/hooks/useWishlist';
import ProductCard from '@/app/(user)/shared/shop-components/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="min-h-screen bg-white pt-8 md:pt-4 md:pb-1">
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-7 text-center">
          <h1 className="text-3xl font-outfit font-extrabold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-500 font-outfit">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {items.length === 0 ? (
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
            {items.map((item: any) => (
              <ProductCard 
                key={item.productId} 
                product={{
                    id: item.productId,
                    sku: item.sku || item.slug, // Fallback if old data
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