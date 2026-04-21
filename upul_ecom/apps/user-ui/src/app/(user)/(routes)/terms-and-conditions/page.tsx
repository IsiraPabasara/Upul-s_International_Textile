'use client';

import React from 'react';
import { usePageTitle } from '@/app/hooks/usePageTitle';

const TermsAndConditions = () => {
  usePageTitle('Terms and Conditions', 'Our terms of service');
  return (
    <div className="container mx-auto px-6 py-8 md:py-12 my-6 md:my-10 max-w-3xl">
      <h1 className="font-outfit text-xl md:text-3xl font-bold mb-6 md:mb-8 uppercase tracking-[0.2em]">
        Terms and Conditions
      </h1>

      <p className="font-outfit text-sm md:text-base leading-relaxed mb-6 text-black/80">
        Welcome to Upuls.lk (operated by UPUL TAILORS (PVT) LTD). These Terms and Conditions explain how you can use our website and purchase products from us. By accessing or using our website, you agree to follow these terms. If you do not agree, please do not use our services.
      </p>

      {/* 1 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">1. Use of the Website</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        To use our website or make a purchase, you must be at least 18 years old. By using this site, you confirm that you meet this requirement or are using it under the supervision of a parent or guardian.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        You are responsible for keeping your account details, including your username and password, secure. Any activity that happens under your account is your responsibility.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        You agree to provide accurate and up-to-date information at all times and not to use the website for any illegal, fraudulent, or harmful activities such as hacking, spreading malware, or violating any laws.
      </p>

      {/* 2 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">2. Product Information and Pricing</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        We do our best to ensure that all product descriptions, images, and prices are accurate. However, occasional errors may occur, and we cannot guarantee that all information will always be completely accurate or up to date.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Prices and product availability may change at any time without prior notice. If a pricing or system error occurs, we reserve the right to cancel or refuse any affected order.
      </p>

      {/* 3 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">3. Orders and Contract Formation</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        When you place an order, you are making an offer to purchase a product. After placing your order, you will receive a confirmation email acknowledging that we have received it.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        Please note that this confirmation does not mean your order has been accepted. A legally binding agreement is only formed once your order has been processed and dispatched.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        We reserve the right to cancel or refuse any order due to product unavailability, pricing errors, or suspected fraudulent activity.
      </p>

      {/* 4 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">4. Payments</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        All payments are securely processed through trusted third-party payment providers.. We do not store or have access to your full card or payment details.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        By placing an order, you authorize us to charge the total amount (including shipping and taxes) to your selected payment method. Transactions may appear under UPUL TAILORS (PVT) LTD on your bank statement.
      </p>

      {/* 5 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">5. Shipping and Delivery</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        We aim to deliver your orders within the estimated timeframes provided. However, delivery times are not guaranteed and may vary due to external factors such as courier delays, weather conditions, or logistical issues.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Once your order has been handed over to the courier service, delivery is managed by them. While we will assist in resolving any issues, we are not responsible for delays caused by third-party couriers.
      </p>

      {/* 6 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">6. Returns and Refunds</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Returns, refunds, and exchanges are handled according to our Return and Exchange Policy. Refunds, where applicable, will be processed back to your original payment method within a reasonable timeframe.
      </p>

      {/* 7 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">7. Order Cancellation</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Orders can only be canceled before they are dispatched. Once an order has been shipped, it cannot be canceled and must follow the return process if applicable.
      </p>

      {/* 8 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">8. Payment Disputes</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        In the event of a payment dispute or chargeback, we reserve the right to provide transaction details, delivery confirmation, and communication records to the payment provider. Fraudulent disputes may result in legal action.
      </p>

      {/* 9 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">9. Intellectual Property</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        All content on this website, including text, images, logos, and designs, belongs to UPUL TAILORS (PVT) LTD. You may not copy, reproduce, or use any content without our written permission.
      </p>

      {/* 10 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">10. Prohibited Uses</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        You agree not to misuse this website. This includes activities such as hacking, data scraping, spreading viruses, sending spam, or violating intellectual property rights. Any misuse may result in immediate suspension or legal action.
      </p>

      {/* 11 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">11. Third-Party Services</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Our website may include services or links provided by third parties, such as payment gateways. We are not responsible for the performance, security, or content of these external services.
      </p>

      {/* 12 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">12. Errors and Omissions</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Occasionally, there may be errors or inaccuracies on our website related to product descriptions, pricing, or availability. We reserve the right to correct such issues and cancel orders if necessary.
      </p>

      {/* 13 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">13. Disclaimer of Warranties</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Our website and services are provided “as is” and “as available” without any guarantees. We do not warrant that the website will always be secure, error-free, or uninterrupted.
      </p>

      {/* 14 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">14. Limitation of Liability</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of our website or products.
      </p>

      {/* 15 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">15. Termination</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        We reserve the right to suspend or terminate your access to our website at any time if you violate these Terms or engage in harmful behavior.
      </p>

      {/* 16 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">16. Governing Law</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        These Terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka, and any disputes will be handled by Sri Lankan courts.
      </p>

      {/* 17 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">17. Entire Agreement</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        These Terms represent the complete agreement between you and us regarding your use of the website and replace any previous agreements or understandings.
      </p>

      {/* 18 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">18. Amendments</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        We may update these Terms from time to time. Continued use of the website after changes are posted means you accept the updated Terms.
      </p>

      {/* 19 */}
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">19. Contact Us</h2>
      <p className="font-outfit text-sm leading-relaxed text-black/80">
        If you have any questions about these Terms, please contact us at{" "}
        through our{" "}
        <a href="/contact-us" className="font-medium hover:opacity-70">
          Contact Page
        </a>.
      </p>
    </div>
  );
};

export default TermsAndConditions;