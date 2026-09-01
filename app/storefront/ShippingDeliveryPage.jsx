// storefront/ShippingPage.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, MapPin, ShieldCheck } from 'lucide-react';

export default function ShippingPage({ setCurrentPage }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white shadow-sm"
      >
        {/* Sharp-cornered full-width black banner strip */}
        <div className="w-full bg-black py-20 px-8 text-center text-white rounded-none">
          <span className="text-[#9b4de0] text-xs font-bold tracking-[0.2em] uppercase block mb-3">Delivery Network</span>
          <h1 className="text-4xl md:text-5xl font-serif font-normal uppercase tracking-wider mb-4">Shipping & Delivery</h1>
          <p className="text-gray-300 max-w-2xl mx-auto font-medium text-sm md:text-base">Fast, reliable, and transparent shipping across the nation.</p>
        </div>
        
        <div className="max-w-5xl mx-auto p-6 md:p-16 space-y-8 bg-[#F8F9FA]">
          
          {/* Card 1: Rates */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="text-[#9b4de0]" size={24} />
              <h2 className="text-xl font-serif font-medium text-gray-900">Shipping Rates</h2>
            </div>
            <ul className="space-y-2 text-gray-600 text-sm md:text-base">
              <li><strong className="text-gray-900 font-semibold">Cash on Delivery:</strong> Rs. 300 - 350</li>
            </ul>
          </motion.div>

          {/* Card 2: Times */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="text-[#9b4de0]" size={24} />
              <h2 className="text-xl font-serif font-medium text-gray-900">Delivery Times</h2>
            </div>
            <ul className="space-y-2 text-gray-600 text-sm md:text-base">
              <li><strong className="text-gray-900 font-semibold">Major Cities:</strong> 2 – 3 Working Days</li>
              <li><strong className="text-gray-900 font-semibold">Other Regions:</strong> 4 – 6 Working Days</li>
            </ul>
          </motion.div>

          {/* Card 3: Tracking */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="text-[#9b4de0]" size={24} />
              <h2 className="text-xl font-serif font-medium text-gray-900">Tracking Your Order</h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Once your order is dispatched, you will receive a confirmation message with a tracking number to track real-time delivery status on our partner courier's website.
            </p>
          </motion.div>

          {/* Card 4: Policy */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-[#9b4de0]" size={24} />
              <h2 className="text-xl font-serif font-medium text-gray-900">Delivery Policy</h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              We strive to deliver every order with care. Please ensure someone is available at the provided address. For COD orders, please have the exact amount ready to facilitate smooth delivery.
            </p>
          </motion.div>

          <div className="text-center pt-4 pb-8">
            <button 
              onClick={() => setCurrentPage('home')}
              className="bg-black text-white px-8 py-3 font-semibold text-sm tracking-wider uppercase rounded-none hover:bg-[#9b4de0] transition-colors"
            >
              Back To Store
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}