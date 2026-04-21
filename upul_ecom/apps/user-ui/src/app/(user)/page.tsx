"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import { usePageTitle } from "@/app/hooks/usePageTitle";

// Import your existing preview widgets
import NewArrivalPreview from "./shared/widgets/NewArrivalPreview";
import MenCategoryPreview from "./shared/widgets/MenCategoryPreview";
import WomenCategoryPreview from "./shared/widgets/WomenCatPreview";
import Hero from "./shared/widgets/banner";
import BrandMarquee from "./shared/widgets/brandsMarquee";

interface SiteImage {
  id: string;
  title: string;
  section:
    | "HERO_BANNER_DESKTOP"
    | "HERO_BANNER_MOBILE"
    | "CATEGORY_GRID"
    | "LOOKBOOK";
  imageUrl: string;
  position: number;
  isActive: boolean;
}


const FeaturedCategories = ({ images, isLoading }: { images: SiteImage[]; isLoading: boolean }) => {
  const categoryMap: Record<number, string> = { 1: "women", 2: "men" };

  return (
    <section className="bg-white py-20 font-outfit mt-0">
      <div className="max-w-8xl mx-auto px-5">
        <div className="flex justify-between items-end mb-16 gap-6">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-cormorant font-medium tracking-tight text-black leading-none">
            The Curated <br /> Edit.
          </h2>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-[0.1em] border-b border-black pb-1">
            View All Categories
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
          {isLoading ? (
            <>
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="aspect-square bg-gray-100 animate-pulse" />
            </>
          ) : (
            [1, 2].map((pos) => {
              const img = images.find((i) => i.position === pos);
              return (
                <Link key={pos} href={`/shop?category=${categoryMap[pos]}`} className="aspect-square relative group overflow-hidden bg-gray-100">
                  {img ? (
                    <img src={img.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Category" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase border border-dashed border-gray-200">Coming Soon</div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

const Lookbook = ({ images, isLoading }: { images: string[]; isLoading: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="bg-black py-20 flex flex-col items-center gap-4">
        <div className="w-full max-w-8xl px-5 h-20 bg-white/5 animate-pulse rounded" />
        <div className="w-full h-[400px] bg-white/5 animate-pulse" />
      </div>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.scrollWidth / images.length;
    const index = Math.round(scrollLeft / itemWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  };

  return (
    <section className="bg-black text-white py-24 border-t border-white/10 font-outfit">
      <div className="max-w-8xl mx-auto px-5 grid grid-cols-1 md:grid-cols-2 gap-20">
        <div className="h-fit md:sticky md:top-24">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4 block">Editorial</span>
          <h2 className="text-5xl md:text-7xl font-cormorant font-medium leading-[0.9] mb-8">Global <br /> Collection</h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mb-10">Elevating your wardrobe with hand-selected imports.</p>
          <Link href="/shop?isNewArrival=true" className="inline-block bg-white text-black px-10 py-4 text-xs font-black uppercase tracking-[0.2em]">Shop The Look</Link>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex flex-col gap-12">
          {images.map((src, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="w-full aspect-[3/4] bg-gray-900 overflow-hidden">
              <img src={src} className="w-full h-full object-cover" alt={`Lookbook ${i}`} />
            </motion.div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden relative">
          <div onScroll={handleScroll} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-5 px-5">
            {images.map((src, i) => (
              <div key={i} className="w-[85vw] aspect-[3/4] shrink-0 bg-gray-900 snap-center">
                <img src={src} className="w-full h-full object-cover" alt={`Lookbook ${i}`} />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-6">
            {images.map((_, i) => (
              <div key={i} className={`h-[2px] w-8 transition-colors ${i === activeIndex ? "bg-white" : "bg-white/20"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- MAIN PAGE ---

export default function HomePage() {
  usePageTitle('Home', 'Shop our collection of premium tailored clothing');
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const { data: allImages = [], isLoading } = useQuery<SiteImage[]>({
    queryKey: ["siteImages"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/site-images");
      return res.data;
    },
  });

  const categoryImages = allImages
    .filter((img) => img.section === "CATEGORY_GRID" && img.isActive)
    .sort((a, b) => a.position - b.position);

  const lookbookImages = allImages
    .filter((img) => img.section === "LOOKBOOK" && img.isActive)
    .sort((a, b) => a.position - b.position)
    .map((img) => img.imageUrl);

  return (
    <main className="w-full min-h-screen font-outfit selection:bg-black selection:text-white">
      <Hero />

      <div className="py-20">
        <NewArrivalPreview />
      </div>
      <div className='mt-[px]'>
        <BrandMarquee/>
      </div>

      <FeaturedCategories images={categoryImages} isLoading={isLoading} />

      <div className="mb-10 pb-3">
        <MenCategoryPreview />
      </div>
      
      <div className="mb-20">
        <WomenCategoryPreview />
      </div>

      <Lookbook images={lookbookImages} isLoading={isLoading} />
    </main>
  );
}