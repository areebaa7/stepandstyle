'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const trustBannerImages = [
  {
    id: 1,
    src: '/Banner/openAndpay.jpeg',
    alt: 'Open then pay',
  },
  {
    id: 2,
    src: '/Banner/premium Handcraft.png',
    alt: 'Premium handcraft',
  },
  {
    id: 3,
    src: '/Banner/return policy.png',
    alt: 'Return policy',
  },
];

export default function TrustBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((index: number, dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + trustBannerImages.length) % trustBannerImages.length;
    goTo(newIndex, 'prev');
  };

  const handleNext = useCallback(() => {
    const newIndex = (currentIndex + 1) % trustBannerImages.length;
    goTo(newIndex, 'next');
  }, [currentIndex, goTo]);

  // Auto-transition
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleNext]);

  return (
    <section className="w-full py-12 md:py-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="mb-10 md:mb-16 text-center">
          <h2 className="text-xs font-semibold  tracking-wide mb-3 text-[#A855F7]">
            Our Commitment
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold  tracking-tight text-gray-900">
            Why Trust Step &amp; Styl?
          </h3>
        </div>

        {/* Carousel Container */}
        <div className="relative w-full overflow-hidden group">
          {/* Images Container */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px]">
            {trustBannerImages.map((item, index) => {
              const isActive = index === currentIndex;

              // Determine slide position class
              let slideClass = '';
              if (isActive) {
                slideClass = 'trust-slide-active';
              } else {
                slideClass = 'trust-slide-hidden';
              }

              return (
                <div
                  key={item.id}
                  className={`absolute inset-0 ${slideClass}`}
                  style={{
                    zIndex: isActive ? 2 : 1,
                  }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1600px"
                    className="object-contain"
                    quality={100}
                    priority={index === 0}
                    onError={() => {
                      console.error(`Failed to load image: ${item.src}`);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/5 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            aria-label="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B21A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/5 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B21A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Progress Bar Indicators */}
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
            {trustBannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index, index > currentIndex ? 'next' : 'prev')}
                className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: index === currentIndex ? '40px' : '12px' }}
                aria-label={`Go to image ${index + 1}`}
              >
                <span className="absolute inset-0 bg-gray-300/60 rounded-full" />
                {index === currentIndex && (
                  <span
                    className="absolute inset-0 bg-[#A855F7] rounded-full"
                    style={{
                      animation: 'trustProgress 5s linear forwards',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .trust-slide-active {
          opacity: 1;
          transform: scale(1) translateX(0);
          animation: trustSlideIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .trust-slide-hidden {
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
        }

        @keyframes trustSlideIn {
          0% {
            opacity: 0;
            transform: scale(1.04);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes trustProgress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
