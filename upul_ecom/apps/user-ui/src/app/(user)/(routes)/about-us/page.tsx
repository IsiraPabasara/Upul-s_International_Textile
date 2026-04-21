'use client';

import React from 'react';
import { usePageTitle } from '@/app/hooks/usePageTitle';

const AboutPage = () => {
  usePageTitle('About Us', 'Learn more about Upul Tailors and our story');
  return (
    <main className="w-full bg-white font-outfit selection:bg-black selection:text-white">
      
      {/* Hero Image Section */}
      <section className="pt-12 md:pt-12 lg:pt-16 px-5 max-w-5xl mx-auto">
        <div className="w-full h-[250px] md:h-[400px] lg:h-[600px] relative rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src="https://ik.imagekit.io/uopcxkuda/503498805_4093425077599975_6036902787313308054_n.png" 
            alt="Upul Tailors Storefront" 
            className="w-full h-full object-cover object-center"
          />
        </div>
      </section>

      {/* Text Content Section */}
      <section className="py-12 md:py-20 px-5 max-w-5xl mx-auto text-gray-800">
  <div className="space-y-12">
    
    {/* Our Story */}
    <div>
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Story</h2>
      <p className="text-base md:text-lg text-gray-600 leading-relaxed">
        Upuls Tailors is built on the simple idea of making stylish clothing accessible to everyone. Since our beginnings in Bandarawela, we have grown from a local physical store into a dedicated online shopping platform. We focus on providing a great variety of ready-made garments for men and women at the best possible quality. Customer service is our top priority, and our team is always here to help you find exactly what you need. As our business continues to grow—with exciting plans to add formal wear and accessories soon—we are focused on making shopping easier and more convenient through our new website.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Our Vision */}
      
    <div>
       <h3 className="text-xl font-bold mb-3">Our Vision</h3>
        <p className="text-gray-600">
          To be a leading retail brand that delivers fashion-forward, ready-to-wear clothing and accessories to customers across the country.
        </p>
    </div>
      

      {/* Our Mission */}
      <div className="">
        <h3 className="text-xl font-bold mb-3">Our Mission</h3>
        <p className="text-gray-600">
          To be a trusted name in the retail market, enhancing the everyday lives of our customers by offering high-quality, stylish products at affordable rates.
        </p>
      </div>
    </div>

  </div>
</section>

    </main>
  );
};

export default AboutPage;