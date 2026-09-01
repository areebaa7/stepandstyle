'use client';

import { useEffect, useRef } from 'react';
import type { ProductDTO } from '@/types/product';
import ScrollAnimate from './ScrollAnimate';
import GlobalProductCard from '@/app/products/components/ProductCard';

interface TrendingProductsCarouselProps {
  products: ProductDTO[];
}

export default function TrendingProductsCarousel({ products }: TrendingProductsCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Infinite continuous auto-scroll effect
  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    const scrollSpeed = 0.8; // pixels per frame for smooth scrolling
    let animationId: number;

    const scroll = () => {
      // Scroll smoothly
      container.scrollLeft += scrollSpeed;

      // When scroll reaches the end, smoothly return to start
      if (container.scrollLeft >= content.scrollWidth - container.clientWidth - 10) {
        // Use setTimeout to reset smoothly
        setTimeout(() => {
          container.scrollLeft = 0;
        }, 500);
      }

      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [products]);

  if (products.length === 0) return null;

  return (
    <section className="w-full py-12 md:py-20 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-16">
          <div>
            <h2 className="text-xs font-semibold  tracking-wide mb-3 text-amber-600">
              Most Wanted
            </h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold  tracking-tight text-gray-900">
              Trending now
            </h3>
          </div>
        </div>

        {/* Carousel */}
        <div className="w-full">
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar"
          >
            <div ref={contentRef} className="flex gap-4 md:gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="shrink-0 min-w-[80vw] sm:min-w-[280px] md:min-w-80"
                >
                  <ScrollAnimate animation="fade-in" delay={`${index * 0.1}s`}>
                    <GlobalProductCard product={product} index={index} />
                  </ScrollAnimate>
                </div>
              ))}
            </div>
          </div>

          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
