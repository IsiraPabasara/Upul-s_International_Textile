'use client';

import React from 'react';
import { usePageTitle } from '@/app/hooks/usePageTitle';

const ReturnExchangePolicy = () => {
  usePageTitle('Return Policy', 'Our return and exchange policy');
  return (
    <div className="container mx-auto px-6 py-8 md:py-12 my-6 md:my-10 max-w-3xl">
      <h1 className="font-outfit text-xl md:text-3xl font-bold mb-6 md:mb-8 uppercase tracking-[0.2em]">Return and Exchange Policy</h1>
      
      <p className="font-outfit text-sm md:text-base leading-relaxed mb-3 text-black/80">
        Thank you for shopping with us. We value your satisfaction and strive to provide you with the best online and in-store shopping experience possible. If you are not completely satisfied with your purchased item, we are here to help.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">Returns & Eligibility</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        We accept returns within 14 days from the date of purchase. To be eligible for a return or exchange, your item must be unused, unwashed, and in the exact same condition that you received it. It must also be in the original packaging with all original price tags perfectly intact.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 font-medium text-black/80">
        Please note: You cannot make more than one exchange request simultaneously for the same order.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">Exchange Procedures</h2>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">We offer two convenient ways to exchange your items:</p>

      <h3 className="font-outfit text-base md:text-lg font-medium mt-5 mb-3">Option 01: Exchange through Courier</h3>
      <ul className="list-disc pl-5 md:pl-6 mb-4 space-y-2 font-outfit text-sm leading-relaxed">
        <li className="text-black/80">
          <strong className="font-medium">Step 01:</strong> Inform us of your need to exchange an item by emailing us at upultailors.site@gmail.com or calling us at 077 849 2307.
        </li>
        <li className="text-black/80">
          <strong className="font-medium">Step 02:</strong> After a brief analysis, our Exchange Team will get back to you with the exact procedure for sending the package back via Registered Post or a Courier Service.
        </li>
        <li className="text-black/80">
          <strong className="font-medium">Step 03:</strong> Post the item back to us within 14 days of your purchase date. Ensure it is in its original condition with price tags attached. Please Email or WhatsApp us the Courier/Postal receipt of your exchange package. (Note: You must bear the cost of the delivery charge).
        </li>
        <li className="text-black/80">
          <strong className="font-medium">Step 04:</strong> Once we have received and inspected the package, a Sales Representative will contact you and provide a unique coupon code. You can use this code to simply redeem the exchange product value on your next online order.
        </li>
      </ul>

      <h3 className="font-outfit text-base md:text-lg font-medium mt-5 mb-3">Option 02: Exchange at Our Physical Outlets</h3>
      <p className="font-outfit text-sm leading-relaxed mb-3 text-black/80">
        Please bring the product within 14 days after receiving it to your nearest physical outlet. You must bring the invoice, the attached price tags, and the ordered item you wish to exchange.
      </p>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        The exchange will be carried out immediately by our staff. If the replacement item you want is out of stock, you can apply the exact value of your return toward the purchase of any other product in the store at that time. If the item has any manufacturing defects, damages, or if you received the wrong item due to our mistake, your money can be fully refunded as detailed in the Refunds section below.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">Refunds</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Refunds are generally issued only in cases where a item has manufacturing defects or damages and a suitable exchange cannot be provided. If an exchange is not possible for a defective item, you are eligible for a full refund to your original method of payment.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">Damaged or Defective Items</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        In the unfortunate event that your item arrives damaged, defective, or you receive the wrong product, please contact us immediately within <b>48 hours</b>. We will arrange for a prompt replacement or issue a refund, depending on your preference and product availability.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">Shipping Costs for Returns</h2>
      <p className="font-outfit text-sm leading-relaxed mb-6 text-black/80">
        Return and exchange shipping costs will be paid at the customer's expense, and you will be required to arrange your own shipping. Exception: If the product is damaged or you received the wrong product due to our error, all shipping charges for the return/exchange will be covered by us.
      </p>

      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">
        Returnable & Exchangeable Items
      </h2>
      <p className="font-outfit text-sm leading-relaxed mb-2 text-black/80">
        All items on the website are eligible for return or exchange within the store's standard policy.      </p>
      
      <h2 className="font-outfit text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 uppercase tracking-widest">Contact Us</h2>
      <p className="font-outfit text-sm leading-relaxed text-black/80">
        If you have any questions about this Privacy Policy, please reach out to us via our <a href="/contact-us" className="text-black font-medium hover:opacity-70 transition-opacity">Contact Us</a> page.
      </p>
    </div>
  );
};

export default ReturnExchangePolicy;