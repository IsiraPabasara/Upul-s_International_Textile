"use client";

import React from 'react';
import { usePageTitle } from '@/app/hooks/usePageTitle';

const PrivacyPolicy = () => {
  usePageTitle('Privacy Policy', 'Our privacy practices');
  return (
    <div className="container mx-auto px-6 py-8 md:py-12 my-6 md:my-10 max-w-3xl">
      <h1 className="font-outfit text-xl md:text-3xl font-bold mb-6 md:mb-8 uppercase tracking-[0.2em]">Privacy Policy</h1>
      
      <p className="font-outfit text-sm md:text-base leading-relaxed mb-3 text-black/80">
        At upuls.lk, operated by UPUL TAILORS (PVT) LTD, we are committed to protecting the privacy and security of our customers' personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you visit or make a purchase on our website.
      </p>
      <p className="font-outfit text-sm md:text-base leading-relaxed mb-6 text-black/80">
        By using our website, you consent to the practices described in this policy.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">1. Information We Collect</h2>
      <p className="font-outfit text-sm leading-relaxed mb-2 text-black/80">When you visit or make a purchase on upuls.lk, we may collect the following information:</p>
      <ul className="list-disc pl-5 md:pl-6 mb-4 space-y-2 font-outfit text-sm leading-relaxed">
        <li className="text-black/80">
          <strong className="font-medium">Personal Identification Information:</strong> Such as your name, email address, phone number, shipping address, and billing address, provided voluntarily by you during account registration or checkout.
        </li>
        <li className="text-black/80">
          <strong className="font-medium">Payment Information:</strong> To process your orders, you will provide payment details. Please note: All credit/debit card transactions are securely handled directly by our trusted third-party payment processor. We do not collect, store, or have access to your full credit card numbers or PINs.
        </li>
        <li className="text-black/80">
          <strong className="font-medium">Browsing Information:</strong> Such as your IP address, browser type, device information, and site interactions, to help us optimize our online store.
        </li>
      </ul>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">2. How We Use Your Information</h2>
      <p className="font-outfit text-sm leading-relaxed mb-2 text-black/80">We use the collected information for the following purposes:</p>
      <ul className="list-disc pl-5 md:pl-6 mb-4 space-y-2 font-outfit text-sm leading-relaxed text-black/80">
        <li>To process, fulfill, and deliver your orders for our ready-made garments.</li>
        <li>To communicate with you regarding your purchases, provide customer support, and respond to inquiries.</li>
        <li>To personalize your shopping experience and present relevant products or promotions.</li>
        <li>To detect and prevent fraud, unauthorized activities, and abuse of our website.</li>
      </ul>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">3. Information Sharing</h2>
      <p className="font-outfit text-sm leading-relaxed mb-2 text-black/80">
        We respect your privacy and do not sell, trade, or rent your personal information to third parties. We only share your data in the following circumstances:
      </p>
      <ul className="list-disc pl-5 md:pl-6 mb-4 space-y-2 font-outfit text-sm leading-relaxed">
        <li className="text-black/80">
          <strong className="font-medium">Trusted Service Providers:</strong> We may share your information with third-party service providers who assist us in operating our website, processing payments, and delivering products. These providers are contractually obligated to handle your data securely and confidentially.
        </li>
        <li className="text-black/80">
          <strong className="font-medium">Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid legal requests from authorities.
        </li>
      </ul>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">4. Cookies and Tracking Technologies</h2>
      <p className="font-outfit text-sm leading-relaxed mb-4 text-black/80">
        Like many websites, upuls.lk uses "cookies" to enhance your browsing experience. Cookies are small data files stored on your device that help us remember your preferences and analyze website traffic. You can choose to disable cookies through your browser settings, though doing so may limit certain features of our site.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">5. Data Security</h2>
      <p className="font-outfit text-sm leading-relaxed mb-4 text-black/80">
        We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">6. Changes to the Privacy Policy</h2>
      <p className="font-outfit text-sm leading-relaxed mb-4 text-black/80">
        We reserve the right to update or modify this Privacy Policy at any time to reflect changes in our practices or legal requirements. Any changes will be posted on this page. We encourage you to review this policy periodically.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">7. Contact Us</h2>
      <p className="font-outfit text-sm leading-relaxed  text-black/80">
        If you have any questions about these Terms and Conditions, please reach out to us via our <a href="/contact-us" className="text-black font-medium hover:opacity-70 transition-opacity">Contact Us</a> page.
      </p>
    </div>
  );
};

export default PrivacyPolicy;