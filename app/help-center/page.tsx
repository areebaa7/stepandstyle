'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import ScrollAnimate from '../components/ScrollAnimate';
import { useBusinessContactSettings } from '@/app/context/BusinessContactContext';

export default function HelpCenterPage() {
  const business = useBusinessContactSettings();
  const hasSupportContact = Boolean(business.whatsappUrl || business.supportEmail || business.supportPhone || business.businessAddress);
  const faqs = [
    {
      q: "How do I place an order?",
      a: "Simply browse our collection, select your size and color, and click 'Add to Cart'. Once you're ready, proceed to checkout where you can enter your shipping details and choose a payment method."
    },
    {
      q: "What payment methods do you accept?",
      a: "The payment methods currently available for your order are displayed at checkout. Delivery charges and estimates are published in our Shipping & Delivery policy."
    },
    {
      q: "Can I change or cancel my order?",
      a: "If your order has not been shipped yet, we can help you modify or cancel it. Please use one of the currently published support options below."
    },
    {
      q: "Do you offer international shipping?",
      a: "Current delivery coverage is maintained in our Shipping & Delivery policy and the location options shown at checkout."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20 md:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollAnimate animation="fade-in" className="text-center mb-20">
            <h1 className="text-3xl sm:text-5xl md:text-5xl font-semibold  tracking-tight text-gray-900 mb-4 md:mb-6">
              Help <span className="text-[#A855F7]">Center</span>
            </h1>
            <p className="text-gray-500 font-medium  tracking-[0.15em] sm:tracking-wide text-xs sm:text-sm">Everything you need to know about shopping with us.</p>
          </ScrollAnimate>

          <div className="space-y-12">
            {faqs.map((faq, i) => (
              <ScrollAnimate key={i} animation="fade-in" delay={`${i * 0.1}s`} className="border-b border-gray-100 pb-8">
                <h3 className="text-lg sm:text-xl font-semibold  tracking-tight text-gray-900 mb-3 sm:mb-4">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{faq.a}</p>
              </ScrollAnimate>
            ))}
          </div>

          {hasSupportContact && <div className="mt-12 md:mt-20 p-6 sm:p-10 bg-[#FAF9FF] rounded-2xl sm:rounded-3xl border border-[#F5F3FF] text-center">
            <h2 className="text-2xl font-semibold  tracking-tight text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-500 mb-8 tracking-wide text-xs font-bold">Choose any available support option.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {business.whatsappUrl && <a href={business.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#25D366] text-white px-7 py-3.5 text-xs font-semibold tracking-wide hover:bg-[#128C7E] transition-all shadow-lg">WhatsApp</a>}
              {business.supportEmail && <a href={`mailto:${business.supportEmail}`} className="inline-block bg-[#6B21A8] text-white px-7 py-3.5 text-xs font-semibold tracking-wide hover:bg-black transition-all shadow-lg">Email support</a>}
              {business.supportPhone && <a href={`tel:${business.supportPhone}`} className="inline-block bg-gray-900 text-white px-7 py-3.5 text-xs font-semibold tracking-wide hover:bg-black transition-all shadow-lg">Call support</a>}
            </div>
            {business.businessAddress && <p className="mt-6 text-sm leading-6 text-gray-600">{business.businessAddress}</p>}
          </div>}
        </div>
      </main>
    </div>
  );
}
