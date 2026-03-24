'use client'

import Link from 'next/link';
// import Image from 'next/image';
import { Facebook, Instagram, MessageCircle, Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-8xl mx-auto px-4 md:px-5">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Socials */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="inline-block">
              {/* <div className="flex flex-col leading-none">
                <span className="text-2xl md:text-3xl font-serif font-bold text-[#1a1a3a] tracking-tighter">
                  U<span className="text-red-600">PUL'S</span>
                </span>
                <span className="text-[7px] md:text-[9px] tracking-[0.3em] font-bold text-[#1a1a3a] border-t border-gray-200 pt-1 uppercase">
                  International
                </span>
              </div> */}
              
              {/* <Image 
                src="/logo1.png" 
                alt="UPUL'S International"
                width={105}
                height={75}
                priority
            /> */}

                           <div className="flex flex-col leading-none">
                <div className="inline-flex items-end">
                  {/* Bigger & wider U */}
                  <span className="text-5xl md:text-5xl font-serif font-bold text-[#1a1a3a] tracking-tight leading-none mr-0.5">
                    U
                  </span>

                  {/* Lines + PUL'S */}
                  <div className="flex flex-col ml-1 mb-2 md:mb-2">
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
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Defining style and quality with a global reach. Join our journey on social media for the latest arrivals and exclusive offers.
            </p>
            <div className="flex items-center gap-4 text-gray-800">
              <a href="#" className="hover:text-red-600 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-red-600 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://wa.me/94768187582" className="hover:text-red-600 transition-colors" aria-label="WhatsApp">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">Customer Care</h4>
            <ul className="flex flex-col gap-3 text-[13px] font-medium uppercase tracking-tight text-gray-600">
              <li><Link href="/about-us" className="hover:text-red-600 transition-colors">About Us</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-red-600 transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/terms-conditions" className="hover:text-red-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-red-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 3: Address 1 - Ratnapura */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">Ratnapura Branch</h4>
            <div className="flex flex-col gap-4 text-[13px] text-gray-600">
              <div className="flex gap-3">
                <MapPin size={18} className="shrink-0 text-gray-400" />
                <span>No. 249, Bandaranayake Mawatha<br />(Moragahayata), Ratnapura, Sri Lanka</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-gray-400" />
                <a href="tel:+94768187582" className="font-bold hover:text-black transition-colors">076 818 7582</a>
              </div>
            </div>
          </div>

          {/* Column 4: Address 2 - Bandarawela */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">Bandarawela Branch</h4>
            <div className="flex flex-col gap-4 text-[13px] text-gray-600">
              <div className="flex gap-3">
                <MapPin size={18} className="shrink-0 text-gray-400" />
                <span>Haputhale Road,<br />Bandarawela, Sri Lanka</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-gray-400" />
                <a href="tel:+94768187580" className="font-bold hover:text-black transition-colors">076 818 7580</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-gray-400" />
                <span className="lowercase">upuls.br.designs@gmail.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
            © {currentYear} UPUL'S INTERNATIONAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}