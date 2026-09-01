import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaleStatus } from '../hooks/useSaleStatus';

export default function TopBanner() {
  const saleInfo = useSaleStatus();

  if (!saleInfo || !saleInfo.show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="bg-gradient-to-r from-[#1A0B2E] via-[#2E073F] to-[#1A0B2E] text-white overflow-hidden relative border-y border-purple-500/30 shadow-inner py-2.5 my-2"
      >
        <div className="relative overflow-hidden min-h-[38px] flex items-center">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex items-center space-x-6 mx-6 shrink-0">
                <span className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                  {saleInfo.bannerText}
                </span>
                <div className="flex items-center gap-2 bg-red-600/20 px-2.5 py-0.5 rounded-full border border-red-500/30">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                  <span className="text-[11px] md:text-xs font-black tracking-wider uppercase text-red-400">
                    Live Sale
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 60s linear infinite;
            width: max-content;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
