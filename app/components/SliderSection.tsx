'use client';

import { useRef, ReactNode } from 'react';
import ScrollAnimate from './ScrollAnimate';
import Link from 'next/link';

interface SliderSectionProps {
  title: string;
  subtitle: string;
  viewAllLink: string;
  accentColor?: string;
  children: ReactNode[];
  itemWidth?: string;
}

export default function SliderSection({ 
  title, 
  subtitle, 
  viewAllLink, 
  accentColor = '#6B21A8',
  children,
  itemWidth = 'min-w-[80vw] sm:min-w-[280px] md:min-w-[320px]'
}: SliderSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (children.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-20">
        <ScrollAnimate animation="fade-in" className="flex justify-between items-end mb-12 border-b border-[#F5F3FF] pb-6">
          <div>
            <h2 className="text-xs font-semibold  tracking-wide mb-2" style={{ color: accentColor }}>{subtitle}</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold  tracking-tight text-[#0B1727]">{title}</h3>
          </div>
          <div className="flex items-center gap-8">
            <Link href={viewAllLink} className="hidden md:block text-xs font-semibold  tracking-wide border-b-2 border-gray-200 pb-1 text-gray-900 hover:border-black transition-all">
              View all
            </Link>
            <div className="flex gap-2 sm:gap-4">
              <button 
                onClick={() => scroll('left')}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </ScrollAnimate>

        <div 
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 md:gap-10 overflow-x-auto no-scrollbar pb-4 sm:pb-8 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {children.map((child, i) => (
            <div 
              key={i} 
              className={`${itemWidth} snap-start`}
            >
              {child}
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
    </section>
  );
}
