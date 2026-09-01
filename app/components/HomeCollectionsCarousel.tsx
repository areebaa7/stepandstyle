'use client';

import Image from 'next/image';
import Link from 'next/link';
import Marquee from 'react-fast-marquee';
import type { CollectionDTO } from '@/types/product';

interface HomeCollectionsCarouselProps {
  collections: CollectionDTO[];
  title: string;
  subtitle: string;
  viewAllLink: string;
  accentColor?: string;
}

export default function HomeCollectionsCarousel({
  collections,
  title,
  subtitle,
  viewAllLink,
  accentColor = '#A855F7',
}: HomeCollectionsCarouselProps) {
  if (collections.length === 0) return null;

  return (
    <section className="w-full py-12 md:py-20 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-16">
          <div>
            <h2 className="text-xs font-semibold  tracking-wide mb-3" style={{ color: accentColor }}>
              {subtitle}
            </h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold  tracking-tight text-gray-900">
              {title}
            </h3>
          </div>
          <Link
            href={viewAllLink}
            className="inline-block text-xs md:text-xs font-semibold  tracking-wide text-gray-600 hover:text-gray-900 transition-colors mt-6 md:mt-0"
          >
            VIEW ALL
          </Link>
        </div>

        {/* Carousel */}
        <div className="w-full px-2">
          <Marquee speed={40} pauseOnHover gradient={false} className="py-4 md:py-5">
            {[...collections, ...collections].map((collection, index) => (
              <Link
                key={`${collection.id}-${index}`}
                href={`/products?collectionId=${collection.id}`}
                className="flex-shrink-0 flex flex-col items-center px-4 md:px-5 gap-3 md:gap-4 group cursor-pointer"
              >
                  {/* Circular Image Container */}
                  <div
                    className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 transition-all duration-300 transform origin-center will-change-transform group-hover:scale-105"
                    style={{
                      borderColor: accentColor,
                      boxShadow: `0 0 0 0 ${accentColor}20`,
                    }}
                  >
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        className="object-cover w-full h-full"
                        sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, 176px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <span className="text-4xl md:text-5xl">👟</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
                  </div>

                  {/* Label */}
                  <span className="text-base md:text-lg font-extrabold tracking-wide text-gray-900 group-hover:text-[#6B21A8] text-center whitespace-nowrap transition-colors drop-shadow-sm">
                    {collection.name}
                  </span>
                </Link>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
