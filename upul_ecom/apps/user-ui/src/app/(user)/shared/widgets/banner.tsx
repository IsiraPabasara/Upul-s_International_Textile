"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="w-full bg-black overflow-hidden">
      <div className="banner-container w-full">
        <div className="bg-black w-full h-full">
          <div className="relative h-full w-full text-white font-outfit">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src="https://ik.imagekit.io/aqi4rj9dnl/475852916_3968769883398829_4365346044412579781_n(1).jpg.jpeg?updatedAt=1770353410315"
                alt="Hero Background"
                className="hidden md:block w-full h-full object-cover opacity-80"
              />
              <img
                src="https://ik.imagekit.io/aqi4rj9dnl/475852916_3968769883398829_4365346044412579781_n(1).jpg.jpeg?updatedAt=1770353410315"
                alt="Hero Background Mobile"
                className="block md:hidden w-full h-full object-cover opacity-70"
              />
            </div>

            <div className="relative z-10 h-full max-w-8xl mx-auto flex flex-col justify-between px-5 pb-16 pt-32">
              <div className="flex justify-between items-start">
                <p className="text-xs sm:text-[0.3rem] md:text-[0.6rem] lg:text-sm md:mb-10 xl:mb-0 xl:text-base font-bold uppercase tracking-[0.2em] border-l-2 border-white pl-4 max-w-[200px] md:max-w-[300px]">
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