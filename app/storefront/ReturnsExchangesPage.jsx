// storefront/ReturnsPage.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

export default function ReturnsPage({ setCurrentPage }) {
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
          <span className="text-[#9b4de0] text-xs font-bold tracking-[0.2em] uppercase block mb-3">Customer Assurance</span>
          <h1 className="text-4xl md:text-5xl font-serif font-normal uppercase tracking-wider mb-4">Returns & Exchanges</h1>
          <p className="text-gray-300 max-w-2xl mx-auto font-medium text-sm md:text-base">Hassle-free returns for a perfect shopping experience.</p>
        </div>
        
        <div className="max-w-5xl mx-auto p-6 md:p-16 space-y-8 bg-[#F8F9FA]">

          {/* Clean Single-Wrapper Image Showcase */}
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden border-2 border-[#9b4de0] shadow-md bg-white relative flex items-center justify-center">
            <img 
              src="/assets/Banner/returnpolicy.png" 
              alt="Step & Styl Return Policy" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // If it fails to load, hide image and show a neat fallback indicator
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* Section 1: How It Works */}
          <div className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif font-medium text-gray-900 mb-6 flex items-center gap-2">
              <RefreshCw className="text-[#9b4de0]" size={22} /> How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Request", desc: "Contact us within 7 days." },
                { step: "02", title: "Review", desc: "We review & authorize." },
                { step: "03", title: "Ship", desc: "Pack & ship back." },
                { step: "04", title: "Refund", desc: "Inspection & processing." }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-xs">
                  <div className="w-8 h-8 bg-[#9b4de0] text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">{item.step}</div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Return Policy */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif font-medium text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="text-[#9b4de0]" size={22} /> Return Policy
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Accepted only in cases of <strong className="text-gray-900">manufacturing faults, damaged items, or sizing issues</strong>.
              <br/><span className="text-xs italic mt-2 inline-block text-gray-500 font-medium">(Note: We do not offer returns or exchanges if the customer simply changes their mind after purchase).</span>
            </p>
          </motion.div>

          {/* Section 3: Non-Returnable Items */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="text-[#9b4de0]" size={22} /> Non-Returnable Items
            </h2>
            <ul className="space-y-2 text-gray-600 text-sm md:text-base">
              <li className="flex items-center gap-2"><span>•</span> Final sale or clearance items</li>
              <li className="flex items-center gap-2"><span>•</span> Customized or personalized orders</li>
              <li className="flex items-center gap-2"><span>•</span> Items without original packaging or tags</li>
            </ul>
          </motion.div>

          {/* Section 4: Exchanges */}
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-[#FAEDFF] border border-gray-200 border-t-4 border-t-[#9b4de0] rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-serif font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="text-[#9b4de0]" size={22} /> Exchanges
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Need a different size? We offer <strong className="text-gray-900">one free exchange per order</strong>. Simply follow the return process and specify your required size.
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