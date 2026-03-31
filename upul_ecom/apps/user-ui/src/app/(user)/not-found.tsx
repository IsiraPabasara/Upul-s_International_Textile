import Link from 'next/link';
import { MoveLeft, PackageX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center mt-40 bg-white px-6 text-center mb-20">
      
      {/* Icon Wrapper with simple bounce/pulse animation */}
      <div className="relative mb-6 md:mb-8">
        {/* Subtle ripple effect background */}
        <div className="absolute inset-0 bg-gray-100 rounded-full animate-ping opacity-75 duration-1000"></div>
        
        <div className="relative bg-gray-50 p-4 md:p-6 rounded-full border border-gray-100 animate-bounce">
            {/* Responsive Icon Size */}
            <PackageX className="w-8 h-8 md:w-12 md:h-12 text-black" strokeWidth={1.5} />
        </div>
      </div>

      {/* Typography Content */}
      <div className="space-y-4 md:space-y-6 max-w-md mx-auto">
        <div className="space-y-1 md:space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-black">404</h1>
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Page Not Found</p>
        </div>

        <div className="h-px w-8 md:w-12 bg-black mx-auto opacity-10"></div>

        <p className="text-gray-500 text-xs md:text-sm leading-relaxed px-4 md:px-0">
            We couldn't find the package you're looking for. It might have been moved, renamed, or perhaps it never existed.
        </p>

        {/* Interactive Button */}
        <div className="pt-2 md:pt-4">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 md:gap-3 px-6 py-2.5 md:px-8 md:py-3 bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-all hover:pl-5 hover:pr-8 md:hover:pl-6 md:hover:pr-10"
            >
              <MoveLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Return Home
            </Link>
        </div>
      </div>

    </div>
  );
}