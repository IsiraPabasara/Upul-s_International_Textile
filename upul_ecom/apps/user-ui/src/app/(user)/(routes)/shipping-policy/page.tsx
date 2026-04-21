'use client';

import React from 'react';
import { usePageTitle } from '@/app/hooks/usePageTitle';

export default function ShippingPolicy() {
  usePageTitle('Shipping Policy', 'Learn about our shipping and delivery');
  return (
    <div className="container mx-auto px-6 py-8 md:py-12 my-6 md:my-10 max-w-3xl">
      <h1 className="font-outfit text-xl md:text-3xl font-bold mb-6 md:mb-8 uppercase tracking-[0.2em]">Shipping and Delivery Policy</h1>
      <p className="font-outfit text-sm md:text-base leading-relaxed mb-6 text-black/80">At upuls.lk (operated by UPUL TAILORS (PVT) LTD), we are committed to delivering your items quickly and safely. This policy outlines our shipping procedures, delivery timeframes, and costs.</p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">1. Order Processing Time</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">All orders are processed within 1 to 2 business days (excluding weekends and Sri Lankan mercantile holidays) after receiving your order confirmation email.</p>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">You will receive another notification email or SMS when your order has been dispatched from our facility.</p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">Please note: During high-volume periods, processing may take slightly longer. We will notify you of any significant delays.</p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">2. Shipping Rates and Delivery Estimates</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">Shipping charges for your order will be calculated and displayed at checkout. Delivery times depend on your location within Sri Lanka:</p>
      <ul className="list-disc pl-5 md:pl-6 mb-6 font-outfit text-sm leading-relaxed text-black/80 space-y-2">
        <li>Colombo & Suburbs: Estimated delivery within 1 to 3 business days.</li>
        <li>Outstation / Rest of Sri Lanka: Estimated delivery within 3 to 5 business days.</li>
      </ul>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">3. Order Tracking</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">Once your order has been handed over to our courier partner, we will provide you with a tracking number and courier partners details via email. You can use this number to check the status of your delivery directly on the courier's tracking portal.</p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">4. Delivery Issues and Delays</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 font-medium text-black/80">Delays:</p>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">While we strive to meet the estimated delivery times, external factors such as severe weather conditions, postal strikes, or roadblocks can occasionally cause courier delays. We appreciate your patience in these rare situations.</p>
      <p className="font-outfit text-sm leading-relaxed mb-3 font-medium text-black/80">Failed Deliveries:</p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">If the courier is unable to deliver the package because you are unavailable or the address provided is incorrect, they will typically attempt delivery one more time. If it fails again, the package will be returned to us, and additional shipping charges may apply to resend it.</p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">6. Damaged or Lost Packages</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">If your order arrives damaged or if you suspect it has been lost in transit, please contact us immediately. We will investigate the issue with the courier and arrange for a replacement or a refund in accordance with our Return and Exchange Policy.</p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">7. Contact Us</h2>
      <p className="font-outfit text-sm leading-relaxed  text-black/80">
        If you have any questions about these Terms and Conditions, please reach out to us via our <a href="/contact-us" className="text-black font-medium hover:opacity-70 transition-opacity">Contact Us</a> page.
      </p>
    </div>
  );
}