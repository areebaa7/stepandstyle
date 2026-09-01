'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ReelDTO, ReelCategory } from '@/types/reel';

const CATEGORY_LABELS: Record<ReelCategory, string> = {
  TRENDING_PRODUCTS: 'Trending Products',
  CUSTOMER_REVIEWS: 'Customer Reviews',
  PRODUCT_DEMONSTRATIONS: 'Product Demonstrations',
  SHORT_REELS: 'Short Reels',
};

function ReelCard({ reel }: { reel: ReelDTO }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.65 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="group relative aspect-[9/16] w-[76vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-[1.75rem] bg-black shadow-xl shadow-purple-950/10 sm:w-[310px] lg:w-[290px]">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.posterUrl || undefined}
        muted={isMuted}
        loop
        autoPlay
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" />



      <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white sm:p-6">
        <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md">
          {CATEGORY_LABELS[reel.category]}
        </span>
        <h3 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">{reel.title}</h3>
        {reel.caption && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">{reel.caption}</p>}
        {reel.productLink && (
          <Link
            href={reel.productLink}
            className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-xs font-bold text-purple-800 transition hover:bg-purple-100"
          >
            Shop now
          </Link>
        )}
      </div>
    </article>
  );
}

export default function ReelsSection() {
  const [reels, setReels] = useState<ReelDTO[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadReels = async () => {
      try {
        const response = await fetch('/api/reels?isActive=true', { cache: 'no-store' });
        const payload = await response.json();
        if (response.ok && payload.success && isMounted) setReels(payload.reels);
      } catch (error) {
        console.warn('Unable to load homepage reels', error);
      }
    };

    loadReels();
    return () => { isMounted = false; };
  }, []);

  if (reels.length === 0) return null;

  return (
    <section className="overflow-hidden border-y border-purple-100 bg-gradient-to-b from-white to-purple-50/70 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto mb-10 max-w-[1600px] px-5 text-center sm:px-10 lg:mb-14 lg:px-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-purple-600">Step &amp; Style in motion</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">Watch. Discover. Shop.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
          Trending picks, honest customer moments and quick product demonstrations.
        </p>
      </div>

      <div className="mx-auto flex max-w-[1600px] snap-x snap-mandatory gap-4 overflow-x-auto px-[12vw] pb-7 sm:gap-5 sm:px-10 lg:gap-6 lg:px-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)}
      </div>
      <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-400 sm:hidden">Swipe to watch more</p>
    </section>
  );
}
