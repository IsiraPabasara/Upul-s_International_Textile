"use client";

import Link from "next/link";
import { useState } from "react";
// import toast from "react-hot-toast";
import axiosInstance from "@/app/utils/axiosInstance";
// import Image from 'next/image';
import {
  Facebook,
  Instagram,
  MessageCircle,
  // Phone,
  // MapPin,
  // Mail,
  ArrowRight,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success
    try {
      const response = await axiosInstance.post("/api/admin/email/newsletter/subscribe", { email });
      setSuccess(response.data.message || "Subscribed successfully!");
      setEmail("");
      
      // Auto-clear success after 5 seconds
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to subscribe. Please try again.";
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-8xl mx-auto px-4 md:px-5">
        
        {/* Main Footer Grid - Updated to lg:grid-cols-5 for perfect spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 lg:gap-8 mb-16">
          
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

              <div className="flex flex-col leading-none w-fit">
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

                <div className="text-[7px] md:text-[8px] tracking-[0.3em] font-bold text-[#1a1a3a] border-t border-gray-200 pt-0.5 md:pt-1 uppercase w-fit">
                  International
                </div>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Defining style and quality with a global reach. Join our journey
              on social media for the latest arrivals and exclusive offers.
            </p>
            <div className="flex items-center gap-4 text-gray-800">
              <a
                href="https://www.instagram.com/upuls_international_casualwear?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                className="hover:text-red-600 transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://web.facebook.com/upulsinternationalbandarawela"
                className="hover:text-red-600 transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://wa.me/94768187582"
                className="hover:text-red-600 transition-colors"
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">
              Info
            </h4>
            <ul className="flex flex-col gap-3 text-[13px] font-medium uppercase tracking-tight text-gray-600">
              <li>
                <Link
                  href="/about-us"
                  className="hover:text-red-600 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="hover:text-red-600 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">
              Legal
            </h4>
            <ul className="flex flex-col gap-3 text-[13px] font-medium uppercase tracking-tight text-gray-600">
              <li>
                <Link
                  href="/return-policy"
                  className="hover:text-red-600 transition-colors"
                >
                  Return Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="hover:text-red-600 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-red-600 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-red-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4-5: Newsletter Subscription (Moved to rightmost) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-gray-100 pb-2">
              Join The Club
            </h4>
            <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered right to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="relative flex items-center max-w-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER YOUR EMAIL"
                required
                className="w-full bg-gray-50 border border-gray-200 text-[11px] md:text-xs tracking-[0.1em] px-4 py-3 md:py-4 focus:outline-none focus:border-black transition-colors"
                disabled={isSubscribing}
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="absolute right-0 top-0 bottom-0 px-4 bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {isSubscribing ? "..." : <ArrowRight size={18} />}
              </button>
            </form>
            {success && (
              <p className="text-green-600 text-[11px] md:text-xs font-medium mt-2">
                ✓ {success}
              </p>
            )}
            {error && (
              <p className="text-red-600 text-[11px] md:text-xs font-medium mt-2">
                {error}
              </p>
            )}
          </div>

          {/* Column: Address 1 - Ratnapura (Commented out) */}
          {/* <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">
              Ratnapura Branch
            </h4>
            <div className="flex flex-col gap-4 text-[13px] text-gray-600">
              <div className="flex gap-3">
                <MapPin size={18} className="shrink-0 text-gray-400" />
                <span>
                  No. 249, Bandaranayake Mawatha
                  <br />
                  (Moragahayata), Ratnapura, Sri Lanka
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-gray-400" />
                <a
                  href="tel:+94768187582"
                  className="font-bold hover:text-black transition-colors"
                >
                  077 444 3445
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-gray-400" />
                <a
                  href="tel:+94768187582"
                  className="font-bold hover:text-black transition-colors"
                >
                  045 222 5673
                </a>
              </div>
            </div>
          </div> */}

          {/* Column: Address 2 - Bandarawela (Commented out) */}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
            © {currentYear} UPUL TAILORS PVT LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}