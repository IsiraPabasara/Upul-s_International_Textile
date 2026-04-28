"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  Package,
  UserCircle,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { useCart } from "@/app/hooks/useCart";
import { useWishlist } from "@/app/hooks/useWishlist";
import useUser from "@/app/hooks/useUser";

// --- Helper Hook: Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Header() {
  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { user } = useUser({ required: false });
  const isLoggedIn = !!user;
  const { toggleCart, items } = useCart();
  const { items: wishlistItems } = useWishlist();

  // --- Fetch Live Announcements from API ---
  const { data: dbAnnouncements = [] } = useQuery({
    queryKey: ["live-announcements"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/announcements", { isPublic: true } as any);
      return res.data;
    },
  });

  // Fallback array if DB is empty or still loading
  const announcements = dbAnnouncements.length > 0 
    ? dbAnnouncements.map((a: any) => a.text)
    : ["WELCOME TO UPUL'S INTERNATIONAL"];

  // --- Prevent Background Scroll When Menu is Open ---
  useEffect(() => {
    if (isMenuOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // --- Click Outside Logic for Desktop Search ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Scroll Logic ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 180) {
        setIsAtTop(true);
        setIsVisible(true);
      } else {
        setIsAtTop(false);
        if (currentScrollY > lastScrollY) {
          setIsVisible(false); // Scrolling Down
        } else {
          setIsVisible(true); // Scrolling Up
        }
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // --- Announcements Logic ---
  useEffect(() => {
    if (announcements.length <= 1) return; 
    
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  // --- Queries ---
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/categories", { isPublic: true } as any);
      return res.data;
    },
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["quick-search", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return { products: [], pagination: { total: 0 } };
      const res = await axiosInstance.get(
        `/api/products/shop?search=${encodeURIComponent(debouncedSearchTerm)}&limit=5`, 
        { isPublic: true } as any
      );
      return res.data;
    },
    enabled: debouncedSearchTerm.trim().length > 1,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setIsMenuOpen(false);
      setIsSearchFocused(false);
    }
  };

  const handleProductClick = (slug: string) => {
    router.push(`/product/${slug}`);
    setIsMenuOpen(false);
    setIsSearchFocused(false);
  };

  // --- Reusable Quick Search Result Component ---
  const QuickSearchResultItem = ({ product }: { product: any }) => {
    const imageUrl = product.images?.[0]?.url || '/placeholder.jpg';
    const price = product.price;
    const finalPrice = product.discountType !== "NONE" 
      ? product.discountType === "PERCENTAGE" 
        ? price - (price * product.discountValue / 100)
        : price - product.discountValue
      : price;

    return (
      <div 
        onClick={() => handleProductClick(product.slug)} 
        className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 overflow-hidden"
      >
        <div className="w-16 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-bold uppercase truncate text-gray-900">{product.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-red-600 font-bold">LKR {finalPrice.toLocaleString()}</span>
            {product.discountType !== "NONE" && (
              <span className="text-[10px] text-gray-400 line-through">LKR {price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="h-[108px] md:h-[145px]" />

      <header
        className={`w-full fixed top-0 z-50 transition-transform duration-300 ease-in-out bg-white ${
          !isVisible && !isAtTop ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className={`overflow-visible transition-all duration-300 ease-in-out ${isAtTop ? "max-h-[200px] opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div className="w-full bg-black text-white py-2 text-center text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase">
            {announcements[announcementIndex] || announcements[0]}
          </div>

          <div className="max-w-8xl mx-auto px-4 md:px-5 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8 border-b">
            <button className="lg:hidden text-gray-800" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>

            <Link href="/" className="flex-shrink-0 ml-3 md:ml-0">
              <div className="flex flex-col leading-none">
                <div className="inline-flex items-end">
                  <span className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a3a] tracking-tight leading-none mr-0.5">U</span>
                  <div className="flex flex-col ml-1 mb-1 md:mb-2">
                    <div className="mb-0.5">
                      <div className="h-[2px] w-8 bg-black mb-1"></div>
                      <div className="h-[2px] w-5 bg-black"></div>
                    </div>
                    <span className="text-red-600 text-sm font-serif font-bold tracking-tighter leading-none">PUL&apos;S</span>
                  </div>
                </div>
                <span className="text-[7px] md:text-[8px] tracking-[0.3em] font-bold text-[#1a1a3a] border-t border-gray-200 pt-0.5 md:pt-1 uppercase">
                  International
                </span>
              </div>
            </Link>

            {/* --- DESKTOP SEARCH FORM --- */}
            <div className="hidden md:flex flex-1 max-w-xl relative" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="flex w-full">
                <input
                  type="text"
                  placeholder="Search For Anything"
                  value={searchTerm}
                  className="w-full border border-gray-400 py-2.5 px-4 text-sm focus:outline-none focus:border-black"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
                <button type="submit" className="bg-black text-white px-5 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                  <Search size={18} />
                </button>
              </form>

              {isSearchFocused && debouncedSearchTerm.trim().length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-sm overflow-hidden z-[9999]">
                  {isSearching ? (
                    <div className="p-6 flex justify-center items-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : searchResults?.products?.length > 0 ? (
                    <div className="flex flex-col max-h-[400px] overflow-y-auto thin-scrollbar">
                      {searchResults.products.map((product: any) => (
                        <QuickSearchResultItem key={product.id} product={product} />
                      ))}
                      <div 
                        onClick={handleSearchSubmit}
                        className="p-3 bg-gray-100 text-center text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-gray-200 transition-colors text-gray-600"
                      >
                        View all {searchResults.pagination.total} results
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs font-bold uppercase tracking-wide text-gray-400">
                      No products found for "{debouncedSearchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop & Mobile Right Icons */}
            <div className="flex items-center gap-3 md:gap-4">
              <Link href={isLoggedIn ? "/profile" : "/login"} className="hidden sm:flex items-center gap-1 hover:text-red-600 transition-all text-gray-800">
                <User className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.2} />
              </Link>

              {/* Wishlist Icon - Hidden on Mobile */}
              <Link href="/wishlist" className="hidden md:flex relative text-gray-800 hover:text-red-600 transition-colors p-1">
                <Heart className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.2} />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Search Icon - Hidden on Desktop, Opens Mobile Menu */}
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="md:hidden relative text-gray-800 hover:text-black transition-colors p-1"
              >
                <Search className="w-6 h-6" strokeWidth={1.2} />
              </button>

              <button onClick={toggleCart} className="relative text-gray-800 hover:text-black transition-colors p-1">
                <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.2} />
                {items.length > 0 && (
                  <span className="absolute top-0 right-0 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Nav */}
        <nav className="relative z-10 bg-white border-b overflow-x-auto scrollbar-hide shadow-sm w-full">
          <div className="max-w-8xl mx-auto px-5 flex gap-6 md:gap-10 h-11 items-center text-[12px] md:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">
            <Link href="/shop" className="shrink-0 hover:opacity-70 transition-opacity">All Products</Link>
            <Link href="/shop?isNewArrival=true" className="shrink-0 hover:opacity-70 transition-opacity">New Arrivals</Link>
            <Link href="/shop?category=men" className="shrink-0 hover:opacity-70 transition-opacity">Men</Link>
            <Link href="/shop?category=women" className="shrink-0 hover:opacity-70 transition-opacity">Women</Link>
            <Link href="/shop?hasDiscount=true" className="text-red-500 shrink-0 hover:opacity-70 transition-opacity pr-4">Sale</Link>
          </div>
        </nav>
      </header>

      {/* --- MOBILE MENU OVERLAY --- */}
      <div
        className={`fixed block md:hidden inset-0 bg-white z-[100] transform transition-transform duration-300 ease-in-out overflow-hidden overflow-x-hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Changed h-screen to h-[100dvh] to handle mobile browser UI height changes */}
        <div className="flex flex-col h-[100dvh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <span className="text-lg font-black tracking-widest uppercase">Menu</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-1">
              <X size={28} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col px-6 py-6">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full border border-gray-300 rounded-md p- mb-6 shadow-sm focus-within:border-black transition-colors bg-white">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                className="flex-1 px-3 py-2 text-base outline-none border-none placeholder-gray-400"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="p-4 bg-black text-white rounded-sm hover:bg-zinc-800 transition-colors">
                <Search size={18} />
              </button>
            </form>

            {/* Mobile Inline Search Results vs Menu Links */}
            {debouncedSearchTerm.trim().length > 1 ? (
              <div className="flex-1 overflow-y-auto overflow-x-hidden border-t border-gray-100 pt-4 pb-24 -mx-6">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-6">Search Results</h3>
                {isSearching ? (
                  <div className="flex justify-center py-10 text-gray-400">
                     <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : searchResults?.products?.length > 0 ? (
                  <div className="flex flex-col px-6">
                    {searchResults.products.map((product: any) => (
                      <QuickSearchResultItem key={product.id} product={product} />
                    ))}
                    <button 
                      onClick={handleSearchSubmit}
                      className="mt-6 w-full py-4 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                    >
                      View all {searchResults.pagination.total} results
                    </button>

                  </div>
                ) : (
                   <div className="text-center py-10 text-xs font-bold uppercase tracking-wide text-gray-400 px-6">
                     No products found
                   </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 text-md font-bold uppercase tracking-tighter pb-24">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link href="/shop?isNewArrival=true" onClick={() => setIsMenuOpen(false)}>New Arrivals</Link>
                {categories.filter((c: any) => !c.parentId).map((cat: any) => (
                  <Link key={cat.id} href={`/shop?category=${cat.slug}`} onClick={() => setIsMenuOpen(false)}>{cat.name}</Link>
                ))}
                <Link href="/shop?hasDiscount=true" className="text-red-500" onClick={() => setIsMenuOpen(false)}>Sale</Link>
                
                <hr className="border-gray-100 my-4" />
                
                <div className="flex flex-col gap-4">
                  {/* --- MOVED WISHLIST INTO MOBILE SIDEBAR --- */}
                  <Link href="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-md relative">
                    <Heart size={18} strokeWidth={1.5} /> 
                    <span className="flex-1">My Wishlist</span>
                    {wishlistItems.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>

                  {isLoggedIn ? (
                    <>
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-md">
                        <UserCircle size={18} strokeWidth={1.5} /> My Profile
                      </Link>
                      <Link href="/profile/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-md">
                        <Package size={18} strokeWidth={1.5} /> My Orders
                      </Link>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center text-sm justify-center w-full bg-black text-white py-4 rounded-sm font-bold uppercase tracking-[0.2em] mt-2">
                      Sign In / Register
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}