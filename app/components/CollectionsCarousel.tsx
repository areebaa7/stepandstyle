'use client';

import Image from 'next/image';
import Marquee from 'react-fast-marquee';
import type { CollectionDTO } from '@/types/product';

interface CollectionsCarouselProps {
  collections: CollectionDTO[];
  selectedCollectionId?: string;
  onCollectionSelect?: (collectionId: string) => void;
}

export default function CollectionsCarousel({
  collections,
  selectedCollectionId,
  onCollectionSelect,
}: CollectionsCarouselProps) {
  if (collections.length === 0) return null;

  return (
    <div className="w-full py-8 md:py-12 bg-white">
      <div className="px-4 sm:px-6 md:px-10">
        <Marquee speed={40} pauseOnHover gradient={false} className="py-4 md:py-5">
          {[...collections, ...collections].map((collection, index) => (
            <button
              key={`${collection.id}-${index}`}
              onClick={() => onCollectionSelect?.(collection.id)}
              className="flex-shrink-0 flex flex-col items-center px-3 md:px-4 gap-3 md:gap-4 group cursor-pointer"
            >
                {/* Circular Image Container */}
                <div
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 transition-all duration-300 transform origin-center will-change-transform group-hover:scale-105 ${
                    selectedCollectionId === collection.id
                      ? 'border-[#A855F7] shadow-lg shadow-[#A855F7]/20'
                      : 'border-gray-300 group-hover:border-[#A855F7]/50'
                  }`}
                >
                  {collection.image ? (
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      className="object-cover w-full h-full"
                      sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 160px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <span className="text-3xl md:text-4xl">👟</span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>

                {/* Label */}
                <span
                  className={`text-base md:text-lg font-extrabold tracking-wide text-center whitespace-nowrap transition-colors duration-300 ${
                    selectedCollectionId === collection.id
                      ? 'text-[#6B21A8]'
                      : 'text-gray-900 group-hover:text-[#6B21A8]'
                  }`}
                >
                  {collection.name}
                </span>
              </button>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
