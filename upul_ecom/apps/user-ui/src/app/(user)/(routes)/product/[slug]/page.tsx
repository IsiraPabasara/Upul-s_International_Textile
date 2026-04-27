"use client";

import { useState, useEffect, useMemo, useRef } from 'react'; // Added useRef
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { useParams, useRouter, notFound } from 'next/navigation';
import { 
  Minus, Plus, ShoppingBag, CheckCircle, AlertCircle, Heart, Loader2, Zap, ChevronDown, ChevronUp, Truck, RotateCcw, FileText, X 
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/app/hooks/useCart';
import { useWishlist } from '@/app/hooks/useWishlist';
import toast from 'react-hot-toast';
import RelatedProducts from '../../../shared/widgets/RelatedProducts';

// --- Types ---
interface ProductVariant {
  size: string;
  stock: number;
}

interface CategoryNode {
  name: string;
  slug: string;
  parent?: CategoryNode; // This allows .parent.parent.slug to work!
}

interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  images: { url: string }[];
  brand: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discountValue: number;
  colors: string[];
  variants: ProductVariant[];
  stock: number;
  availability: boolean;
  visible: boolean;
  category?: CategoryNode;
  sizeType?: string;
  sizeChartUrl?: string;
}

// --- Components ---


const ProductGallery = ({ images, name }: { images: { url: string }[], name: string }) => {
  const [activeImage, setActiveImage] = useState(images?.[0]?.url || '');
  
  // Mobile specific state
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(images?.[0]?.url) setActiveImage(images[0].url);
  }, [images]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', 
    });
  }, []);

  const scrollToImage = (index: number) => {
    if (sliderRef.current) {
      const width = sliderRef.current.offsetWidth;
      sliderRef.current.scrollTo({
        left: width * index,
        behavior: 'auto'
      });
      setMobileActiveIndex(index);
    }
  };

  const handleScroll = () => {
    if (sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setMobileActiveIndex(index);
    }
  };

  if (!images || images.length === 0) return <div className="bg-gray-100 h-96 rounded-xl flex items-center justify-center text-gray-400">No Image</div>;

  return (
    <div className="w-full">
      {/* === MOBILE: Swipeable Slider + Thumbnails === */}
      <div className="md:hidden flex flex-col gap-3">
        
        {/* Main Slider - Applied custom aspect ratio */}
        <div className="relative w-full aspect-[1024/1536] bg-gray-50 rounded-2xl overflow-hidden group">
          <div 
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full"
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={`${name} ${idx}`}
                className="w-full h-full object-cover flex-shrink-0 snap-center"
              />
            ))}
          </div>
          
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
             {mobileActiveIndex + 1} / {images.length}
          </div>
        </div>

        {/* Mobile Thumbnail Row - Match ratio for thumbs too */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => scrollToImage(idx)}
              className={`relative flex-shrink-0 w-16 aspect-[1024/1536] rounded-lg overflow-hidden border-1 border-t-2 border-b-2 transition-all 
                ${mobileActiveIndex === idx ? 'border-black ring-1 ring-black' : 'border-transparent opacity-70'}`}
            >
              <img 
                src={img.url} 
                alt={`thumb-${idx}`} 
                className="w-full h-full object-cover" 
              />
            </button>
          ))}
        </div>
      </div>

      {/* === DESKTOP: Vertical Thumbs + Main Image === */}
      <div className="hidden md:flex flex-row gap-4 items-start">
        {/* Thumbnails column */}
        <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto no-scrollbar py-1">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              onMouseEnter={() => setActiveImage(img.url)}
              onClick={() => setActiveImage(img.url)}
              className={`w-20 aspect-[1024/1536] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all 
                ${activeImage === img.url ? 'border-black ring-1 ring-black' : 'border-transparent hover:border-gray-300'}`}
            >
              <img src={img.url} alt={`${name} ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Main Image - Removed fixed height, used aspect ratio + flex-1 */}
        <div className="flex-1 bg-gray-50 rounded-2xl overflow-hidden relative aspect-[1024/1536]">
          <img src={activeImage || images[0]?.url} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

// add a x in lucid imports
// const ProductGallery = ({ images, name }: { images: { url: string }[], name: string }) => {
//   const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
//   const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
//   const sliderRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
//   }, []);

//   useEffect(() => {
//     if (selectedImageUrl) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
//   }, [selectedImageUrl]);

//   const scrollToImage = (index: number) => {
//     if (sliderRef.current) {
//       const width = sliderRef.current.offsetWidth;
//       sliderRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
//       setMobileActiveIndex(index);
//     }
//   };

//   const handleScroll = () => {
//     if (sliderRef.current) {
//       const scrollLeft = sliderRef.current.scrollLeft;
//       const width = sliderRef.current.offsetWidth;
//       const index = Math.round(scrollLeft / width);
//       setMobileActiveIndex(index);
//     }
//   };

//   if (!images || images.length === 0) return <div className="bg-gray-100 h-96 rounded-xl flex items-center justify-center text-gray-400">No Image</div>;

//   return (
//     <div className="w-full">
//       {/* === DESKTOP LIGHTBOX === */}
//       {selectedImageUrl && (
//         <div 
//           className="hidden md:flex fixed inset-0 z-[100] items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300"
//           onClick={() => setSelectedImageUrl(null)}
//         >
//           <button 
//             className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110]"
//             onClick={() => setSelectedImageUrl(null)}
//           >
//             <X size={32} />
//           </button>
//           <div className="relative flex items-center justify-center max-w-[90vw] max-h-[75vh] animate-in zoom-in-95 duration-300">
//             <img src={selectedImageUrl} alt="Full view" className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-2xl" />
//           </div>
//         </div>
//       )}

//       {/* === MOBILE VIEW: Slider + Thumbnails ONLY === */}
//       <div className="md:hidden flex flex-col gap-3">
//         {/* Main Slider */}
//         <div className="relative w-full aspect-[2/3] bg-gray-50 rounded-2xl overflow-hidden">
//           <div 
//             ref={sliderRef}
//             onScroll={handleScroll}
//             className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full"
//           >
//             {images.map((img, idx) => (
//               <img
//                 key={`mobile-main-${idx}`}
//                 src={img.url}
//                 alt={`${name} ${idx}`}
//                 className="w-full h-full object-cover flex-shrink-0 snap-center"
//               />
//             ))}
//           </div>
//           <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">
//              {mobileActiveIndex + 1} / {images.length}
//           </div>
//         </div>

//         {/* Thumbnail Row - This is what you wanted to keep */}
//         <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
//           {images.map((img, idx) => (
//             <button
//               key={`mobile-thumb-${idx}`}
//               onClick={() => scrollToImage(idx)}
//               className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all 
//                 ${mobileActiveIndex === idx ? 'border-black' : 'border-transparent opacity-60'}`}
//             >
//               <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* === DESKTOP VIEW: Grid ONLY === */}
//       <div className="hidden md:grid grid-cols-2 gap-3">
//         {images.map((img, idx) => {
//           if (idx > 3) return null;
//           const isFourth = idx === 3 && images.length > 4;

//           return (
//             <div 
//               key={`desktop-grid-${idx}`} 
//               onClick={() => setSelectedImageUrl(img.url)}
//               className="relative aspect-[2/3] bg-gray-50 rounded-xl overflow-hidden group cursor-zoom-in"
//             >
//               <img 
//                 src={img.url} 
//                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
//                 alt={name} 
//               />
//               {isFourth && (
//                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
//                   <span className="text-xl font-bold">+{images.length - 4} More</span>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };




const AccordionItem = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className="font-bold text-gray-900 flex items-center gap-3 text-sm uppercase tracking-wide">
          {Icon && <Icon size={18} className="text-gray-400 group-hover:text-black transition-colors" />}
          {title}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <div className="text-sm text-gray-600 leading-relaxed px-1 pl-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ProductPage() {
    // ... Copy the rest of your original ProductPage function here exactly as it was ...
    // ... I am truncating the rest for brevity as the logic below this point has not changed ...
  const { slug } = useParams();
  const router = useRouter();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Note: ensure your addItem function accepts a second 'openCart' boolean argument
  const { items, addItem } = useCart(); 
  const { toggleItem, isInWishlist } = useWishlist();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/products/${slug}`);
      return res.data;
    }
  });

  const isWishlisted = product ? isInWishlist(product.id) : false;

  // --- Derived State ---
  const isOneSizeProduct = product?.sizeType === 'One Size';
  const hasVariants = !!product && !isOneSizeProduct && Array.isArray(product.variants) && product.variants.length > 0;

  // --- ⚡ AUTO SELECT SIZE ON LOAD ---
  useEffect(() => {
    if (product && hasVariants && !selectedSize) {
      const firstAvailable = product.variants.find(v => v.stock > 0);
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size);
      } else if (product.variants.length > 0) {
        setSelectedSize(product.variants[0].size);
      }
    }
  }, [product, hasVariants, selectedSize]);

  // --- 🧠 STOCK LOGIC ---
  const remainingStock = useMemo(() => {
    if (!product) return 0;
    
    let totalStockForSelection = 0;
    
    if (hasVariants) {
      if (!selectedSize) return 0; 
      const variant = product.variants.find(v => v.size === selectedSize);
      totalStockForSelection = variant ? variant.stock : 0;
    } else {
      totalStockForSelection = product.stock || 0;
    }

    const cartItem = items.find(item => {
      if (item.productId !== product.id) return false;
      if (hasVariants) return item.size === selectedSize; 
      return true; 
    });

    const alreadyInCart = cartItem ? cartItem.quantity : 0;
    return Math.max(0, totalStockForSelection - alreadyInCart);

  }, [items, product, selectedSize, hasVariants]);

  useEffect(() => {
    setQuantity(1);
    setValidationErrors([]);
  }, [selectedSize]);

  // --- DISABLE BACKGROUND SCROLL WHEN SIZE CHART OPENS ---
  useEffect(() => {
    if (showSizeChart) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSizeChart]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!product) notFound();
  
  // Show 404 if product is not visible
  if (!product.visible) {
    notFound();
  }

  // Debug: Log the product data
  console.log('Product loaded:', product);
  console.log('Product category:', product.category);
  console.log('Category name:', product.category?.name);

  const originalPrice = product.price;
  let finalPrice = originalPrice;
  if (product.discountType === 'PERCENTAGE') {
    finalPrice = originalPrice - (originalPrice * (product.discountValue / 100));
  } else if (product.discountType === 'FIXED') {
    finalPrice = originalPrice - product.discountValue;
  }

  const canAddToCart = product.availability && remainingStock > 0 && (!hasVariants || (hasVariants && selectedSize));

  // --- HANDLERS ---
  const handleIncreaseQty = () => { 
    if (quantity < remainingStock) {
      setQuantity(prev => prev + 1);
      setValidationErrors([]);
    }
  };
  const handleDecreaseQty = () => { 
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
      setValidationErrors([]);
    }
  };

  const createCartItem = () => {
    const cartSku = (hasVariants && selectedSize) ? `${product.sku}-${selectedSize}` : product.sku;
    const variantMaxStock = hasVariants 
        ? product.variants.find(v => v.size === selectedSize)?.stock || 0
        : product.stock || 0;

    return {
      sku: cartSku,
      productId: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: product.price,
      image: product.images?.[0]?.url || '',
      quantity: quantity,
      size: hasVariants ? selectedSize : undefined,
      maxStock: variantMaxStock
    };
  };

  const handleAddToCart = async () => {
    if (hasVariants && !selectedSize) { toast.error('Please select a size first'); return; }
    if (quantity > remainingStock) { toast.error(`Limit reached for this item.`); return; }

    const newItem = createCartItem();
    addItem(newItem); // Opens cart by default
    toast.success("Added to cart");

    try { await axiosInstance.post('/api/cart', newItem, { isPublic: true }); } catch (error) {}
  };

  const handleBuyNow = async () => {
    if (hasVariants && !selectedSize) { toast.error('Please select a size first'); return; }
    if (quantity > remainingStock) { toast.error(`Limit reached for this item.`); return; }

    setValidationErrors([]);
    setIsBuyingNow(true);
    const newItem = createCartItem();
    
    // 👇 UPDATE: Pass 'false' to suppress the cart slider/drawer opening
    addItem(newItem, false);

    try { await axiosInstance.post('/api/cart', newItem, { isPublic: true }); } catch (error) {}

    const verificationItems = [...items];
    const existingItemIndex = verificationItems.findIndex(i => i.sku === newItem.sku);
    if (existingItemIndex > -1) {
        verificationItems[existingItemIndex] = {
            ...verificationItems[existingItemIndex],
            quantity: verificationItems[existingItemIndex].quantity + newItem.quantity
        };
    } else {
        verificationItems.push(newItem);
    }

    try {
        const { data } = await axiosInstance.post('/api/cart/verify', { items: verificationItems });
        if (data.isValid) {
            router.push('/checkout');
        } else {
            const errors = data.errors || ['Stock or price mismatch detected. Please review your cart.'];
            setValidationErrors(Array.isArray(errors) ? errors : [errors]);
            setIsBuyingNow(false);
        }
    } catch (error: any) {
        const errorMessage = error?.response?.data?.errors || ['Something went wrong. Try again.'];
        setValidationErrors(Array.isArray(errorMessage) ? errorMessage : [errorMessage]);
        setIsBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
      const item = {
        productId: product.id,
        name: product.name,
        price: finalPrice,
        image: product.images[0]?.url || '',
        slug: product.slug, 
        brand: product.brand,
        sku: product.sku,
        discountType: product.discountType,
        discountValue: product.discountValue,
        availability: product.availability
      };
      toggleItem(item); // @ts-ignore
      if (!isWishlisted) toast.success("Added to wishlist");
      else toast.success("Removed from wishlist");
      try { await axiosInstance.post('/api/wishlist/toggle', item, { isPublic: true }); } catch (err) {}
  };

  return (
    <div className="bg-white min-h-screen pb-20 mt-8 md:mt-2 md:pt-5">
      
      {/* === SIZE CHART MODAL === */}
      {showSizeChart && product.sizeChartUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 h-screen w-screen">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowSizeChart(false)} 
          />
          <div className="relative bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Size Guide</h3>
              <button 
                onClick={() => setShowSizeChart(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh]">
              <img 
                src={product.sizeChartUrl} 
                alt="Size Chart" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-1 md:pt-0 md:pb-0 md:py-4 text-xs md:text-sm text-gray-500">
        <Link href="/">Home</Link> <span className="mx-2">/</span>
        <Link href="/shop">Shop</Link> <span className="mx-2">/</span>
        <span className="text-black font-medium">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
        
        {/* Left: Gallery (Mobile Slide / Desktop Grid) */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Right: Details */}
        <div className="space-y-8 font-outfit">
          <div className="space-y-2 border-b border-gray-100 pb-6">
            <div className="flex justify-between items-start">
               <h1 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 leading-tight">{product.name}</h1>
               <button onClick={handleWishlistToggle} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <Heart size={28} fill={isWishlisted ? "currentColor" : "none"} />
               </button>
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold text-gray-900">LKR {finalPrice.toLocaleString()}</span>
              {product.discountType !== 'NONE' && (
                <>
                  <span className="text-lg text-gray-400 line-through">LKR {originalPrice.toLocaleString()}</span>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    {product.discountType === 'PERCENTAGE' ? `-${product.discountValue}%` : 'SALE'}
                  </span>
                </>
              )}
            </div>

            {/* COD Tag
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mt-4 bg-gray-50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
               <Banknote size={14} className="text-green-600" />
               Cash on Delivery Available
            </div> */}

            {/* Stock Status */}
            <div className="pt-6 space-y-2 text-xs text-gray-500">
                <p>Brand: <span className="text-gray-900 font-medium">{product.brand || "Upul's International"}</span></p>
                <p>SKU: <span className="text-gray-900 font-medium">{product.sku}</span></p>
                
                {(hasVariants && !selectedSize) ? (
                    <p className="text-blue-600 flex items-center gap-1 font-medium mt-2"><AlertCircle size={14} /> Select a size to see stock</p>
                ) : remainingStock > 0 ? (
                   <p className="text-green-600 flex items-center gap-1 font-medium mt-2">
                     <CheckCircle size={14} /> In Stock 
                     {remainingStock < 5 && <span className="text-red-500 ml-1">(Only {remainingStock} left!)</span>}
                   </p>
                ) : (
                   <p className="text-red-500 flex items-center gap-1 font-medium mt-2"><AlertCircle size={14} /> Out of Stock</p>
                )}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-6">
            {hasVariants && remainingStock > 0 && (
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Select Size</h3>
                  
                  {/* === SIZE CHART TRIGGER === */}
                  {product.sizeChartUrl && (
                    <button 
                      onClick={() => setShowSizeChart(true)}
                      className="text-xs font-semibold text-gray-500 hover:text-black flex items-center gap-1.5 transition-all group underline-offset-4 hover:underline"
                    >
                      <FileText size={14} className="group-hover:scale-110 transition-transform" />
                      View Size Chart
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants
                    .filter(v => v.size) // Filter empty sizes
                    .map((v: ProductVariant) => (
                    <button
                      key={v.size}
                      disabled={v.stock === 0}
                      onClick={() => setSelectedSize(v.size)}
                      className={`min-w-[3.5rem] h-12 px-4 rounded border transition-all text-sm font-bold
                        ${selectedSize === v.size 
                            ? 'bg-black text-white border-black shadow-md' 
                            : 'bg-white text-gray-900 border-gray-200 hover:border-black'}
                        ${v.stock === 0 ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 line-through border-gray-100' : ''}
                      `}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4">
            
            {/* Row 1: Quantity + Add to Cart */}
            <div className="flex items-center gap-3 h-14">
                {/* Quantity Selector */}
                <div className={`flex items-center border border-gray-200 rounded-lg h-full ${(remainingStock === 0 && (!hasVariants || selectedSize)) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button onClick={handleDecreaseQty} disabled={quantity <= 1} className="p-4 hover:bg-gray-50 disabled:opacity-30 h-full flex items-center">
                        <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                    <button onClick={handleIncreaseQty} disabled={quantity >= remainingStock} className="p-4 hover:bg-gray-50 disabled:opacity-30 h-full flex items-center">
                        <Plus size={16} />
                    </button>
                </div>

                {/* Add to Cart Button */}
                <button 
                    onClick={handleAddToCart}
                    disabled={!canAddToCart || isBuyingNow}
                    className="flex-1 h-full border-2 border-black text-black bg-white rounded-lg font-bold uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                >
                    <ShoppingBag size={18} /> Add to Cart
                </button>
            </div>

            {/* Row 2: Full Width Buy Now */}
            <button 
                onClick={handleBuyNow}
                disabled={!canAddToCart || isBuyingNow}
                className="w-full h-16 bg-black text-white rounded-lg font-bold uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-xl shadow-gray-200"
            >
                {isBuyingNow ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : (
                    <><Zap size={18} fill="currentColor" /> Buy Now</>
                )}
            </button>

            {/* Validation Error Display */}
            {validationErrors.length > 0 && (
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-700 text-sm mb-2">Validation Error</p>
                            <ul className="space-y-1">
                                {validationErrors.map((error, idx) => (
                                    <li key={idx} className="text-red-600 text-sm">• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Details Accordion */}
          <div className="pt-8">
             <AccordionItem title="Description" icon={FileText} defaultOpen={true}>
                <p className="whitespace-pre-line leading-relaxed">{product.description || "No description available."}</p>
             </AccordionItem>
             
             <AccordionItem title="Shipping & Delivery" icon={Truck}>
                <p className="mb-2">We offer island-wide delivery across Sri Lanka.</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-500">
                    <li>Colombo & Suburbs: <span className="text-gray-900 font-medium">1-2 Working Days</span></li>
                    <li>Outstation: <span className="text-gray-900 font-medium">3-5 Working Days</span></li>
                    <li>Standard Delivery Charge: <span className="text-gray-900 font-medium">LKR 450</span></li>
                </ul>
             </AccordionItem>

             <AccordionItem title="Returns & Exchanges" icon={RotateCcw}>
                <p>We want you to be completely satisfied with your purchase.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500">
                    <li>Exchanges within <b>7 days</b> of delivery.</li>
                    <li>Items must be unworn with tags attached.</li>
                    <li>Clearance/Sale items are non-refundable.</li>
                </ul>
             </AccordionItem>
          </div>

        </div>
      </div>

      {product.category && (
        <RelatedProducts 
          // We create an array: [Current Slug, Parent Slug, Grandparent Slug]
          // The .filter(Boolean) removes any undefined values if a parent doesn't exist
          categorySlugs={[
            product.category.slug, 
            product.category.parent?.slug, 
            product.category.parent?.parent?.slug
          ].filter(Boolean) as string[]} 
          currentProductId={product.id}
          categoryName={product.category.name}
        />
      )}

      {/* Utility Styles for Scrollbar Hiding */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
    </div>
  );
}