"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import Image from 'next/image';
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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { useCart } from "@/app/hooks/useCart";
import { useWishlist } from "@/app/hooks/useWishlist";
import useUser from "@/app/hooks/useUser";

export default function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isAtTop, setIsAtTop] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { user } = useUser({ required: false });
  const isLoggedIn = !!user;
  const router = useRouter();
  const { toggleCart, items } = useCart();
  const { items: wishlistItems } = useWishlist();

  const announcements = [
    "ISLAND WIDE CASH-ON DELIVERY - SHOP NOW",
    "30% OFF ON ALL ITEMS - LIMITED TIME ONLY",
    "GLOBAL WIDE DELIVERY AVAILABLE",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Increase this value (e.g., 100) to "wait" longer at the top
      // before Part 1 & 2 start collapsing.
      if (currentScrollY < 180) {
        setIsAtTop(true);
        setIsVisible(true);
      } else {
        setIsAtTop(false);

        // Only trigger the hide/show logic after passing the 100px threshold
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/categories", {
        isPublic: true,
      } as any);
      return res.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* 1. Spacer to prevent content jump */}
      <div className="h-[108px] md:h-[145px]" />

      {/* 2. Main Header (Sticky/Scroll Logic) */}
      <header
        className={`w-full fixed top-0 z-50 transition-transform duration-300 ease-in-out bg-white ${
          !isVisible && !isAtTop ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isAtTop ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="w-full bg-black text-white py-2 text-center text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase">
            {announcements[announcementIndex]}
          </div>

          <div className="max-w-8xl mx-auto px-4 md:px-5 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8 border-b">
            <button
              className="lg:hidden text-gray-800"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={24} />
            </button>

            <Link href="/" className="flex-shrink-0">
              {/* <div className="flex flex-col leading-none">
                <span className="text-2xl md:text-4xl font-serif font-bold text-[#1a1a3a] tracking-tighter">U<span className="text-red-600 text-sm">PUL'S</span></span>
                <span className="text-[7px] md:text-[10px] tracking-[0.3em] font-bold text-[#1a1a3a] border-t border-gray-200 pt-0.5 md:pt-1 uppercase">International</span>
              </div> */}
              <div className="flex flex-col leading-none">
                <div className="inline-flex items-end">
                  {/* Bigger & wider U */}
                  <span className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a3a] tracking-tight leading-none mr-0.5">
                    U
                  </span>

                  {/* Lines + PUL'S */}
                  <div className="flex flex-col ml-1 mb-1 md:mb-2">
                    {/* Decorative lines */}
                    <div className="mb-0.5">
                      <div className="h-[2px] w-8 bg-black mb-1"></div>
                      <div className="h-[2px] w-5 bg-black"></div>
                    </div>

                    {/* PUL'S aligned with U bottom */}
                    <span className="text-red-600 text-sm font-serif font-bold tracking-tighter leading-none">
                      PUL&apos;S
                    </span>
                  </div>
                </div>

                <span className="text-[7px] md:text-[8px] tracking-[0.3em] font-bold text-[#1a1a3a] border-t border-gray-200 pt-0.5 md:pt-1 uppercase">
                  International
                </span>
              </div>

              {/* <Image 
                src="/logo1.png" 
                alt="UPUL'S International"
                width={100}
                height={70}
                priority
              /> */}
            </Link>

            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search For Anything"
                  className="w-full border border-gray-400 py-2.5 px-4 text-sm focus:outline-none focus:border-black"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-black text-white px-5 flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Search size={18} />
              </button>
            </form>

            <div className="flex items-center gap-3 md:gap-4">
              <Link
                href={isLoggedIn ? "/profile" : "/login"}
                className="hidden sm:flex items-center gap-1 hover:text-red-600 transition-all text-gray-800"
              >
                <User className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.2} />
                <div className="flex flex-col -gap-1">
                  {/* <span className="text-[10px] uppercase text-gray-400 font-bold leading-none">
                    Account
                  </span> */}
                  {/* <span className="text-xs font-bold uppercase tracking-tight leading-none">
                    {isLoggedIn && user?.firstname
                      ? `Hi, ${user.firstname}`
                      : "Sign In"}
                  </span> */}
                </div>
              </Link>

              <Link
                href="/wishlist"
                className="relative text-gray-800 hover:text-red-600 transition-colors p-1"
              >
                <Heart className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.2} />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <button
                onClick={toggleCart}
                className="relative text-gray-800 hover:text-black transition-colors p-1"
              >
                <ShoppingCart
                  className="w-6 h-6 md:w-7 md:h-7"
                  strokeWidth={1.2}
                />
                {items.length > 0 && (
                  <span className="absolute top-0 right-0 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <nav className="bg-white border-b overflow-x-auto scrollbar-hide shadow-sm w-full">
          <div className="max-w-8xl mx-auto px-5 flex gap-6 md:gap-10 h-11 items-center text-[12px] md:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">
            <Link
              href="/shop?isNewArrival=true"
              className="shrink-0 hover:opacity-70 transition-opacity"
            >
              New Arrivals
            </Link>
            {categories
              .filter((c: any) => !c.parentId)
              .map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="shrink-0 hover:opacity-70 transition-opacity"
                >
                  {cat.name}
                </Link>
              ))}
            <Link
              href="/shop?hasDiscount=true"
              className="text-red-500 shrink-0 hover:opacity-70 transition-opacity pr-4"
            >
              Sale
            </Link>
          </div>
        </nav>
      </header>

      {/* 3. Mobile Menu Overlay (Moved outside <header> to be on top of everything) */}
      <div
        className={`fixed block md:hidden inset-0 bg-white z-[100] transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <span className="text-lg font-black tracking-widest uppercase">Menu</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-1">
              <X size={28} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            <form 
            onSubmit={handleSearch} 
            className="flex items-center w-full border border-gray-200 rounded-lg p- mb-8 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 px-4 py-0 text-base outline-none border-none placeholder-gray-400"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit" 
              className="p-3 bg-black text-white rounded-md hover:bg-zinc-800 transition-colors"
            >
              <Search size={20} />
            </button>
          </form>

            <div className="flex flex-col gap-4 text-md font-bold uppercase tracking-tighter">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/shop?isNewArrival=true" onClick={() => setIsMenuOpen(false)}>New Arrivals</Link>
              {categories.filter((c: any) => !c.parentId).map((cat: any) => (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`} onClick={() => setIsMenuOpen(false)}>{cat.name}</Link>
              ))}
              <Link href="/shop?hasDiscount=true" className="text-red-500" onClick={() => setIsMenuOpen(false)}>Sale</Link>
              
              <hr className="border-gray-100 my-4" />
              
              <div className="flex flex-col gap-4">
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
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center text-sm justify-center w-full bg-black text-white py-4 rounded-sm font-bold uppercase tracking-[0.2em]">
                    Sign In / Register
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
