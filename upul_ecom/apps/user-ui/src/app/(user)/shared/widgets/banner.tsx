// "use client";
// import React from 'react';
// import Link from 'next/link';
// import { ArrowUpRight } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Autoplay, Navigation, EffectFade, Pagination } from "swiper/modules";

// // --- Swiper Styles ---
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
// import "swiper/css/effect-fade";

// const Hero = () => {
//   const bannerImages = [
//     {
//       id: 2,
//       desktopUrl: "https://thilakawardhana.com/cdn/shop/files/IMG_7277_JPG.jpg?v=1769587092&width=2000",
//       mobileUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
//       alt: "Seasonal Collection",
//       title: "Seasonal",
//       subtitle: "The Winter Edit"
//     },
//     {
//       id: 3,
//       desktopUrl: "https://thilakawardhana.com/cdn/shop/files/Pongal_1.jpg?v=1768284039&width=2000",
//       mobileUrl: "https://www.forever21.com/cdn/shop/files/ChatGPT_Image_Jan_30_2026_06_20_51_PM.png?v=1769815264&width=500",
//       alt: "New Arrivals",
//       title: "Arrivals",
//       subtitle: "New Modern Classics"
//     },
//   ];

//   return (
//     <section className="w-full bg-black overflow-hidden">
//       <Swiper
//         modules={[Autoplay, Navigation, Pagination, EffectFade]}
//         effect="fade"
//         fadeEffect={{ crossFade: true }}
//         slidesPerView={1}
//         loop={true}
//         speed={1000}
//         autoplay={{ delay: 5000, disableOnInteraction: false }}
//         pagination={{ clickable: true }}
//         className="banner-swiper w-full"
//       >
        
//         {/* --- SLIDE 1: THE TRADITION HERO --- */}
//         <SwiperSlide className="bg-black w-full h-full">
//           <div className="relative h-full w-full text-white font-outfit">
//             <div className="absolute inset-0">
//               <img
//                 src="https://ik.imagekit.io/aqi4rj9dnl/475852916_3968769883398829_4365346044412579781_n(1).jpg.jpeg?updatedAt=1770353410315"
//                 alt="Hero Background"
//                 className="hidden md:block w-full h-full object-cover opacity-80"
//               />
//               <img
//                 src="https://ik.imagekit.io/aqi4rj9dnl/475852916_3968769883398829_4365346044412579781_n(1).jpg.jpeg?updatedAt=1770353410315"
//                 alt="Hero Background Mobile"
//                 className="block md:hidden w-full h-full object-cover opacity-70"
//               />
//             </div>

//             <div className="relative z-10 h-full max-w-8xl mx-auto flex flex-col justify-between px-5 pb-16 pt-32">
//               <div className="flex justify-between items-start">
//                 {/* UPDATED: 
//                    1. Added `md:text-sm lg:text-base` to scale the description text slightly on larger screens.
//                    2. Added `md:max-w-[300px]` to allow more width on desktop.
//                 */}
//                 <p className="text-xs sm:text-[0.3rem] md:text-[0.6rem] lg:text-sm md:mb-10 xl:mb-0 xl:text-base font-bold uppercase tracking-[0.2em] border-l-2 border-white pl-4 max-w-[200px] md:max-w-[300px]">
//                   Redefining modern silhouette through structure and chaos.
//                 </p>
//               </div>

//               <div>
//                 {/* UPDATED H1 SIZING:
//                    1. `text-[14vw]` -> Keeps your mobile look exactly as is.
//                    2. `md:text-[clamp(6rem,13vw,11rem)]` -> This is the magic for desktop:
//                       - clamp(MIN, PREFERRED, MAX)
//                       - It will never be smaller than 6rem on a laptop.
//                       - It will try to be 13% of the viewport width.
//                       - It will never exceed 11rem on giant monitors.
//                 */}
//                 <motion.h1
//                   initial={{ y: 80, opacity: 0 }}
//                   whileInView={{ y: 0, opacity: 1 }}
//                   transition={{ duration: 0.8, ease: "easeOut" }}
//                   className="text-[14vw] sm:text-[clamp(4rem,8vw,9rem)] md:text-[clamp(3.5rem,2vw,7rem)] lg:text-[clamp(6rem,9vw,10rem)] xl:text-[clamp(6rem,9vw,11rem)] leading-[0.8] font-cormorant font-black tracking-tighter uppercase"
//                 >
//                   Tradition
//                 </motion.h1>

//                 <div className="flex flex-col md:flex-row justify-between items-end mt-4 border-t border-white/20 pt-6">
//                   {/* UPDATED: Added md:text-sm to scale the metadata slightly */}
//                   <span className="text-[0.6rem] md:text-[0.65rem] lg:text-xs xl:text-sm uppercase tracking-[0.2em]">Est. 1940 — Ratnapura / Bandarawela</span>
                  
//                   <Link href="/shop" className="group flex items-center gap-2 text-xs md:text-[0.7rem] lg:text-sm xl:text-base font-bold uppercase tracking-widest mt-6 md:mt-0">
//                     Explore Collection
//                     <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </SwiperSlide>

//         {/* --- SLIDES 2 & 3: IMAGE BANNERS --- */}
//         {bannerImages.map((banner) => (
//           <SwiperSlide key={banner.id} className="bg-black w-full h-full">
//             <div className="relative w-full h-full">
//               <img
//                 src={banner.desktopUrl}
//                 alt={banner.alt}
//                 className="hidden md:block w-full h-full object-cover"
//               />
//               <img
//                 src={banner.mobileUrl}
//                 alt={banner.alt}
//                 className="block md:hidden w-full h-full object-cover"
//               />
//             </div>
//           </SwiperSlide>
//         ))}
//       </Swiper>

//       <style jsx global>{`
//         .banner-swiper {
//           aspect-ratio: 1024 / 1536;
//           height: auto;
//         }
//         @media (min-width: 768px) {
//           .banner-swiper {
//             aspect-ratio: 4000 / 1558;
//             height: auto;
//           }
//         }
//         @media (min-width: 1280px) {
//           .banner-swiper {
//             aspect-ratio: auto;
//             height: calc(100vh - 145px);
//           }
//         }
//         .swiper-pagination-bullet {
//           background: white !important;
//           opacity: 0.5;
//           transition: all 0.3s ease;
//         }
//         .swiper-pagination-bullet-active {
//           opacity: 1;
//           transform: scale(1.2);
//         }
//       `}</style>
//     </section>
//   );
// };

// export default Hero;
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SiteImage {
  id: string;
  title: string;
  imageUrl: string;
  position: number;
}

interface HeroProps {
  desktopImages?: SiteImage[];
  mobileImages?: SiteImage[];
}

const Hero = ({ desktopImages = [], mobileImages = [] }: HeroProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="w-full bg-black overflow-hidden">
      <div className="banner-container w-full">
        <div className="bg-black w-full h-full">
          <div className="relative h-full w-full text-white font-outfit">
            {/* Background image with skeleton placeholder */}
            <div className="absolute inset-0">
              {/* Skeleton loader - visible until images load */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 animate-pulse z-0" />
              )}
              <img
                src="https://ik.imagekit.io/aqi4rj9dnl/475852916_3968769883398829_4365346044412579781_n(1).jpg.jpeg?updatedAt=1770353410315"
                alt="Hero Background"
                className={`hidden md:block w-full h-full object-cover opacity-80 transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-80' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              <img
                src="https://ik.imagekit.io/aqi4rj9dnl/475852916_3968769883398829_4365346044412579781_n(1).jpg.jpeg?updatedAt=1770353410315"
                alt="Hero Background Mobile"
                className={`block md:hidden w-full h-full object-cover opacity-70 transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-70' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/3 md:bg-black/5"></div>
            </div>

            <div className="relative z-10 h-full max-w-8xl mx-auto flex flex-col justify-between px-5 pb-8 pt-12 sm:pb-12 sm:pt-16 md:pb-16 md:pt-20 lg:pt-24 xl:pt-32">
              <div className="flex justify-between items-start">
                <p className="text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg font-bold uppercase tracking-[0.2em] border-l-2 border-white pl-4 max-w-[200px] md:max-w-[300px] mt-12 md:mt-0 md:mb-10 xl:mb-0">
                  Redefining modern silhouette through structure and chaos.
                </p>
              </div>

              <div>
                <motion.h1
                  initial={{ y: 80, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-[14vw] sm:text-[clamp(4rem,8vw,9rem)] md:text-[clamp(3.5rem,2vw,7rem)] lg:text-[clamp(6rem,9vw,10rem)] xl:text-[clamp(6rem,9vw,11rem)] leading-[0.8] font-cormorant font-black tracking-tighter uppercase"
                >
                  Tradition
                </motion.h1>

                <div className="flex flex-col md:flex-row justify-between items-end mt-4 border-t border-white/20 pt-6">
                  <span className="text-[0.6rem] md:text-[0.65rem] lg:text-xs xl:text-sm uppercase tracking-[0.2em]">Est. 1940 — Ratnapura / Bandarawela</span>
                  
                  <Link href="/shop" className="group flex items-center gap-2 text-xs md:text-[0.7rem] lg:text-sm xl:text-base font-bold uppercase tracking-widest mt-6 md:mt-0">
                    Explore Collection
                    <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .banner-container {
          aspect-ratio: 1024 / 1536;
          height: auto;
        }
        @media (min-width: 768px) {
          .banner-container {
            aspect-ratio: 4000 / 1558;
            height: auto;
          }
        }
        @media (min-width: 1280px) {
          .banner-container {
            aspect-ratio: auto;
            height: calc(100vh - 145px);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;