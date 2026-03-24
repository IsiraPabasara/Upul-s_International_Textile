import React from 'react';

const BrandMarquee = () => {
  const brands = [
    { name: "Polo", logo: "https://ik.imagekit.io/aqi4rj9dnl/polo-resized?updatedAt=1769868189791", scale: "scale-100" },
    { name: "Crocodile", logo: "https://ik.imagekit.io/aqi4rj9dnl/26259486105.png", scale: "scale-100" },
    { name: "Signature", logo: "https://ik.imagekit.io/aqi4rj9dnl/image.png", scale: "scale-100" },
    { name: "Puma", logo: "https://ik.imagekit.io/aqi4rj9dnl/image%20(1).png", scale: "scale-90" },
    { name: "Lacoste", logo: "https://ik.imagekit.io/aqi4rj9dnl/image%20(2).png", scale: "scale-90" },
    { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1200px-Adidas_Logo.svg.png", scale: "scale-90" },
  ];

  // We triple the brands for the mobile swipe to ensure they don't hit a "dead end" too quickly
  const displayBrands = [...brands, ...brands, ...brands];

  return (
    <div className="relative w-full bg-white py-7 border-y border-gray-300">
      {/* Edge Fades - pointer-events-none allows swiping "through" the gradients */}
      <div className="absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

      {/* Main Container: 
          - overflow-x-auto + scrollbar-hide enables swiping on mobile.
          - On hover (desktop), we pause the animation.
      */}
      <div className="flex overflow-x-auto no-scrollbar touch-pan-x">
        <div className="flex w-max animate-marquee items-center gap-12 md:gap-24 px-4 hover:[animation-play-state:paused]">
          {displayBrands.map((brand, index) => (
            <div 
              key={index} 
              className={`flex-shrink-0 flex items-center justify-center 
                w-[120px] h-[60px] md:w-[180px] md:h-[80px] 
                ${brand.scale} transition-all duration-500`}
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-w-full max-h-full object-contain opacity-80 grayscale hover:grayscale-0 hover:opacity-100 select-none"
                draggable="false"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                }}
              />
              <span className="fallback hidden font-bold text-gray-400 uppercase text-sm">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); } /* Adjusted to 1/3 since we tripled the array */
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        /* Stop animation on mobile if the user starts touching/swiping */
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 40s;
          }
        }
      `}</style>
    </div>
  );
};

export default BrandMarquee;