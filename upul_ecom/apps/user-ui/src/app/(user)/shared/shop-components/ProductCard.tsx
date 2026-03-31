'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/app/hooks/useWishlist';
import axiosInstance from '@/app/utils/axiosInstance';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: {
    id: string;
    sku: string;
    name: string;
    price: number;
    brand: string;
    images: { url: string }[];
    discountType: 'NONE' | 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    availability: boolean;
    slug?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toggleItem, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const originalPrice = product.price;
  let finalPrice = originalPrice;
  
  if (product.discountType === 'PERCENTAGE') {
    finalPrice = originalPrice - (originalPrice * (product.discountValue / 100));
  } else if (product.discountType === 'FIXED') {
    finalPrice = originalPrice - product.discountValue;
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const item = {
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images[0]?.url || '',
      slug: product.slug || product.sku,
      brand: product.brand,
      sku: product.sku,
      discountType: product.discountType,
      discountValue: product.discountValue,
      availability: product.availability
    };

    toggleItem(item); 
    if (!isWishlisted) toast.success("Added to wishlist");
    else toast.success("Removed from wishlist");

    try {
       await axiosInstance.post('/api/wishlist/toggle', item, { isPublic: true });
    } catch (err) { /* silent fail */ }
  };

  return (
    /* Always visible border and subtle shadow to match the reference images */
    <div className="group  relative bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
      <Link href={`/product/${product.sku}`}>
        {/* Image expanded fully to the edges of the card */}
        <div className="relative aspect-[2/3] bg-[#f5f5f5] overflow-hidden">
          {product.images[0] ? (
            <img 
              src={product.images[0].url} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              No Image
            </div>
          )}

          {/* Minimalist Badges */}
          <div className="absolute top-0 left-0 flex flex-col">
            {product.discountType !== 'NONE' && (
              <span className="bg-black text-white text-[9px] tracking-widest font-bold px-3 py-1.5 uppercase">
                Sale
              </span>
            )}
            {!product.availability && (
              <span className="bg-red-500 text-white text-[9px] tracking-widest font-bold px-3 py-1.5 uppercase border-b border-r border-black/5">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist Button - Visible on hover */}
          <button 
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 p-1.5 bg-white/50 backdrop-blur-sm rounded-full text-gray-900"
          >
            <Heart 
              size={18} 
              strokeWidth={1.5} 
              className={isWishlisted ? "fill-black" : "fill-none"} 
            />
          </button>
        </div>

        {/* Details Section with specific typography from the image */}
        <div className="p-4 space-y-2">
          <p className="text-[12px] text-gray-500 font-medium font-outfit tracking-tight">
            {product.brand || "Upul's International"}
          </p>
          
          <h3 className="text-[18px] text-gray-800 leading-tight font-cormorant font-semibold">
            {product.name}
          </h3>
          
          <div className="flex flex-col pt-1">
            <span className="text-[14px] font-bold text-black tracking-tight font-outfit">
              LKR {finalPrice.toLocaleString()}
            </span>
            
            {product.discountType !== 'NONE' && (
              <span className="text-gray-400 line-through text-[11px] font-light font-outfit">
                LKR {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}