'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { BannerDTO } from '@/types/banner';
import HeroSaleCards from './HeroSaleCards';

function BannerSlide({ banner, index, active }: { banner: BannerDTO; index: number; active: boolean }) {
  const desktopImage = (banner.desktopImageSlot ?? 1) === 2 ? banner.mobileImageUrl : banner.desktopImageUrl;
  const mobileImage = (banner.mobileImageSlot ?? 2) === 1 ? banner.desktopImageUrl : banner.mobileImageUrl;
  return (
    <article
      className={`absolute inset-0 transition-opacity duration-700 ${active ? 'visible opacity-100' : 'invisible opacity-0'}`}
      aria-hidden={!active}
      data-testid={active ? 'banner-slide-active' : undefined}
    >
      <Image
        src={mobileImage}
        alt={banner.title || `Banner ${index + 1}`}
        fill
        className='object-cover md:hidden'
        priority={index === 0}
        sizes='100vw'
      />
      <Image
        src={desktopImage}
        alt={banner.title || `Banner ${index + 1}`}
        fill
        className='hidden object-cover md:block'
        priority={index === 0}
        sizes='100vw'
      />
      {(banner.title || banner.subtitle || banner.ctaText) && (
        <>
          <div className='absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/20' />
          <div className='absolute inset-0 flex flex-col items-center justify-end px-16 pb-12 text-center text-white md:items-start md:justify-center md:px-24 md:pb-0 md:text-left'>
            {banner.title && <h1 className='text-3xl font-black uppercase drop-shadow-md md:text-6xl'>{banner.title}</h1>}
            {banner.subtitle && <p className='mt-3 max-w-xl text-sm font-medium drop-shadow-md md:text-xl'>{banner.subtitle}</p>}
            {banner.ctaText && banner.ctaLink && (
              <Link href={banner.ctaLink} className='mt-6 bg-white px-8 py-3 text-xs font-bold uppercase tracking-widest text-gray-950 shadow-lg hover:bg-purple-100'>
                {banner.ctaText}
              </Link>
            )}
          </div>
        </>
      )}
    </article>
  );
}

export default function BannerSlideshow({ banners }: { banners: BannerDTO[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeIndex = banners.length ? currentIndex % banners.length : 0;

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = window.setInterval(
      () => setCurrentIndex((previous) => (previous + 1) % banners.length),
      5000
    );
    return () => window.clearInterval(interval);
  }, [banners.length]);

  if (!banners.length) return null;

  const move = (amount: number) => {
    setCurrentIndex((previous) => (previous + amount + banners.length) % banners.length);
  };

  return (
    <section
      className='relative aspect-[4/5] w-full overflow-hidden bg-purple-50 md:aspect-[12/5]'
      aria-label='Featured banners'
      aria-roledescription='carousel'
      data-testid='banner-slider'
    >
      {banners.map((banner, index) => (
        <BannerSlide key={banner.id} banner={banner} index={index} active={index === activeIndex} />
      ))}

      <HeroSaleCards />

      {banners.length > 1 && (
        <>
          <button type='button' onClick={() => move(-1)} className='absolute left-3 top-1/2 z-20 flex h-11 w-11 items-center justify-center -translate-y-1/2 rounded-full bg-white/90 text-purple-700 shadow-md transition-all duration-300 hover:bg-[#A855F7] hover:text-yellow-300 hover:shadow-[0_0_18px_rgba(253,224,71,0.4)] hover:scale-110 active:scale-95' aria-label='Previous banner'>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button type='button' onClick={() => move(1)} className='absolute right-3 top-1/2 z-20 flex h-11 w-11 items-center justify-center -translate-y-1/2 rounded-full bg-white/90 text-purple-700 shadow-md transition-all duration-300 hover:bg-[#A855F7] hover:text-yellow-300 hover:shadow-[0_0_18px_rgba(253,224,71,0.4)] hover:scale-110 active:scale-95' aria-label='Next banner'>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div className='absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2' role='tablist' aria-label='Choose banner'>
            {banners.map((banner, index) => (
              <button
                type='button'
                key={banner.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full ${index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/55'}`}
                aria-label={`Show banner ${index + 1}`}
                aria-selected={index === activeIndex}
                role='tab'
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
