'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useBusinessContactSettings } from '@/app/context/BusinessContactContext';

export default function AffiliateBanner() {
  const { affiliateProgram } = useBusinessContactSettings();
  const highestCommission = Math.max(affiliateProgram.defaultCommissionPercent, ...affiliateProgram.tiers.map((tier) => tier.commissionPercent));
  return (
    <section className="relative w-full py-16 overflow-hidden bg-white">
      <div className="max-w-[1600px] mx-auto px-6 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(107,33,168,0.2)] border border-purple-50"
        >
          {/* Background Image Container */}
          <div className="relative min-h-[420px] md:h-[500px] w-full">
            <Image
              src="/Banner/affiliate.png"
              alt="Join our Affiliate Program"
              fill
              sizes="(max-width: 768px) 100vw, 1600px"
              className="object-cover"
            />
            {/* Premium Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/95 via-purple-900/70 md:via-purple-900/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 md:from-black/60 via-transparent to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-20 text-center md:text-left items-center md:items-start">
            <div className="max-w-2xl space-y-4 md:space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center md:justify-start gap-3"
              >
                <span className="hidden md:block h-[2px] w-12 bg-amber-400" />
                <span className="text-xs md:text-sm font-semibold  tracking-wide text-amber-400">
                  Earn While You Share
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-5xl font-semibold text-white  tracking-tight leading-[1.1] md:leading-[1.08]"
              >
                Join the <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 italic font-serif normal-case tracking-normal">Elite</span> Affiliate <br className="hidden md:block" />
                Network
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[13px] md:text-lg text-purple-100 max-w-md font-medium leading-relaxed opacity-90 mx-auto md:mx-0"
              >
                Partner with Step & Styl and earn premium commissions on every sale you refer. High conversion rates & dedicated support.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col md:flex-row items-center gap-6 pt-4 md:pt-6"
              >
                <Link
                  href="/affiliate"
                  className="w-full md:w-auto px-10 py-4 md:py-5 bg-amber-400 text-black text-xs md:text-xs font-semibold  tracking-wide rounded-full hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-2xl text-center"
                >
                  Apply now
                </Link>
                <div className="flex flex-col items-center md:items-start justify-center">
                  <p className="text-xs font-semibold  tracking-wide text-white/60 mb-0.5">Up to</p>
                  <p className="text-xl md:text-2xl font-semibold text-amber-400 leading-tight">Up to {highestCommission}% Commission</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative Corner Element */}
          <div className="absolute top-0 right-0 p-12 hidden lg:block">
            <div className="w-24 h-24 border-t-2 border-r-2 border-white/20 rounded-tr-3xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
