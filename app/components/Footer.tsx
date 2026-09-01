'use client';

import React, { useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NewsletterSignupForm from '@/app/components/NewsletterSignupForm';
import { useNewsletterSettings } from '@/app/hooks/useNewsletterSettings';
import { useBusinessContactSettings } from '@/app/context/BusinessContactContext';

const subscribeToHydration = () => () => {};

type SocialLink = {
  name: string;
  url: string;
  path: string;
  hoverColor: string;
};

function useHasHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

const Footer = () => {
  const hasHydrated = useHasHydrated();
  const newsletterSettings = useNewsletterSettings();
  const business = useBusinessContactSettings();
  const socialLinks: SocialLink[] = [
    business.facebookUrl ? {
      name: 'Facebook',
      url: business.facebookUrl,
      path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
      hoverColor: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30',
    } : null,
    business.instagramUrl ? {
      name: 'Instagram',
      url: business.instagramUrl,
      path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z',
      hoverColor: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30',
    } : null,
    business.tiktokUrl ? {
      name: 'TikTok',
      url: business.tiktokUrl,
      path: 'M15 3v10.5a4.5 4.5 0 1 1-4-4.47 M15 3c.5 2.5 2 4 5 4',
      hoverColor: 'hover:text-white hover:bg-white/10 hover:border-white/30',
    } : null,
    business.youtubeUrl ? {
      name: 'YouTube',
      url: business.youtubeUrl,
      path: 'M22 12s0-3-1-5c-.5-1-1.5-1.5-3-1.7C16 5.5 12 5.5 12 5.5s-4 0-6 .3C4.5 6 3.5 6.5 3 7c-1 2-1 5-1 5s0 3 1 5c.5 1 1.5 1.5 3 1.7 2 .3 6 .3 6 .3s4 0 6-.3c1.5-.2 2.5-.7 3-1.7 1-2 1-5 1-5z M10 9l5 3-5 3z',
      hoverColor: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/30',
    } : null,
    business.supportEmail ? {
      name: 'Email',
      url: `mailto:${business.supportEmail}`,
      path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
      hoverColor: 'hover:text-[#EA4335] hover:bg-[#EA4335]/10 hover:border-[#EA4335]/30',
    } : null,
  ].filter((entry): entry is SocialLink => entry !== null);
  const hasPublicContact = Boolean(socialLinks.length || business.supportPhone || business.businessAddress);

  return (
    <footer suppressHydrationWarning className="bg-[#110C1F] text-white pt-10 pb-6 md:pt-10 md:pb-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-20">
        {/* Main Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-2 gap-x-0 gap-y-10 md:gap-y-12 lg:gap-y-0 mb-8 md:mb-10 ${hasPublicContact ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {/* Brand Column - Full width on mobile */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-6 md:gap-8 items-start text-left lg:pr-8">
            <div>
              <Link href="/" className="group flex items-center justify-start h-4">
                <Image
                  src="/logo_main.png"
                  alt="Step & Styl"
                  width={180}
                  height={50}
                  className="object-contain h-14 md:h-16 w-auto transition-all duration-300 group-hover:scale-105"
                  priority
                />
                <div className="flex items-center -ml-4 md:-ml-5 mb-0 gap-1">
                  <span className="text-[13px] md:text-[15px] font-bold tracking-wide text-[#A855F7] transition-all">
                    Step
                  </span>
                  <span className="text-[13px] md:text-[15px] font-bold tracking-wide text-yellow-600 transition-all">
                    &
                  </span>
                  <span className="text-[13px] md:text-[15px] font-bold tracking-wide text-[#A855F7] transition-all">
                    Styl
                  </span>
                </div>
              </Link>
            </div>
            <p className="text-white text-sm md:text-base font-normal leading-relaxed tracking-wide max-w-[300px]">
              Premium footwear for the modern individual. Designed for absolute comfort, crafted for timeless style.
            </p>
          </div>

          {/* Customer service */}
          <div className="pr-4 md:pr-6 lg:border-l lg:border-white/15 lg:px-8">
            <h4 className="font-semibold text-sm md:text-base tracking-wide text-[#A855F7] mb-6 md:mb-10">Customer service</h4>
            <ul className="space-y-3 md:space-y-4 text-white text-sm md:text-[15px] font-medium tracking-wide">
              <li><Link href="/track-order" className="hover:text-yellow-300 transition-colors font-semibold text-yellow-300">📦 Track your order</Link></li>
              <li><Link href="/help-center" className="hover:text-yellow-300 transition-colors">Contact us</Link></li>
              <li><Link href="/shipping-delivery" className="hover:text-yellow-300 transition-colors">Shipping & delivery</Link></li>
              <li><Link href="/returns-exchanges" className="hover:text-yellow-300 transition-colors">Returns & exchanges</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-yellow-300 transition-colors">Privacy policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-yellow-300 transition-colors">Terms & conditions</Link></li>
            </ul>
          </div>

          {/* About us */}
          <div className="border-l border-white/15 pl-4 md:pl-6 lg:px-8">
            <h4 className="font-semibold text-sm md:text-base tracking-wide text-[#A855F7] mb-6 md:mb-10">About us</h4>
            <ul className="space-y-3 md:space-y-4 text-white text-sm md:text-[15px] font-medium tracking-wide">
              <li><Link href="/our-story" className="hover:text-yellow-300 transition-colors">Our story</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          {hasHydrated && (
            <div className="col-span-2 lg:col-span-1 lg:border-l lg:border-white/15 lg:px-8">
              <h4 className="font-semibold text-sm md:text-base tracking-wide text-[#A855F7] mb-6 md:mb-10">Newsletter</h4>
              <p className="text-white/60 text-xs md:text-sm font-medium tracking-wide mb-4">
                New arrivals, private offers and style inspiration.
              </p>
              <NewsletterSignupForm
                source="footer"
                consentText={newsletterSettings.consentText}
                privacyPolicyUrl={newsletterSettings.privacyPolicyUrl}
                variant="dark"
                stacked
              />
            </div>
          )}

          {/* Public contact details */}
          {hasPublicContact && <div className="col-span-2 sm:col-span-1 lg:border-l lg:border-white/15 lg:pl-8">
            <h4 className="font-semibold text-sm md:text-base tracking-wide text-[#A855F7] mb-6 md:mb-8">Connect</h4>
            <div className="flex gap-4 md:gap-5">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.url}
                  target={social.name !== 'Email' ? '_blank' : undefined}
                  rel={social.name !== 'Email' ? 'noopener noreferrer' : undefined}
                  className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/5 text-white border border-white/10 transition-all duration-300 ${social.hoverColor} group`}
                  aria-label={social.name}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110"
                  >
                    <path d={social.path} />
                  </svg>
                </Link>
              ))}
            </div>
            <div className="mt-5 space-y-2 text-sm text-white/70">
              {business.supportPhone && <a className="block hover:text-yellow-300" href={`tel:${business.supportPhone}`}>{business.supportPhone}</a>}
              {business.businessAddress && <p className="leading-6">{business.businessAddress}</p>}
            </div>
          </div>}
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800/50 pt-6 md:pt-8">
          <p className="text-white text-sm font-medium tracking-wide text-center">&copy; 2026 Step & Styl. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
