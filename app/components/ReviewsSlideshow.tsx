'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  productId: string;
  productName: string;
  productImage?: string;
  date: string;
}

export default function ReviewsSlideshow() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/reviews/featured', { cache: 'no-store' });
        const data = await response.json();
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        } else {
          console.warn('API returned success:false or no reviews array', data);
        }
      } catch (error) {
        console.error('Unable to load featured reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedReviews();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || reviews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000); // Change review every 5 seconds

    return () => clearInterval(interval);
  }, [reviews.length, isAutoPlaying]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (reviews.length === 0 && !isLoading) {
    return (
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                What Our Customers Say
              </span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Real reviews from satisfied customers across Pakistan
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 italic">
              No featured reviews available yet.
            </div>
          )}
        </div>
      </section>
    );
  }

  // Handle loading state while we have no reviews yet but are fetching
  if (isLoading && reviews.length === 0) {
    return (
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-64 bg-gray-100 rounded-2xl w-full max-w-4xl mx-auto"></div>
           </div>
        </div>
      </section>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <section className="py-16 md:py-20 bg-lavender-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4  tracking-tight">
            <span className="text-lavender-dark">
              What Our Customers Say
            </span>
          </h2>
          <p className="text-gray-500 text-sm  tracking-wide font-bold">
            Real reviews from satisfied customers across Pakistan
          </p>
        </div>

        {/* Main Review Card */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="h-[390px] sm:h-[360px] md:h-[380px] bg-white rounded-[2rem] shadow-xl p-5 sm:p-6 md:p-8 border border-lavender-main relative overflow-hidden">
            {/* Decorative gradient background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-lavender-light rounded-full blur-3xl opacity-50 -z-0"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-lavender-main rounded-full blur-3xl opacity-50 -z-0"></div>
            
            <div className="relative z-10 flex h-full flex-col">
              {/* Reviewer and reviewed product stay together at the top. */}
              <div className="grid shrink-0 grid-cols-2 items-center gap-3 border-b border-lavender-light pb-4 md:pb-5">
                <div className="flex min-w-0 items-center justify-center gap-3 border-r border-lavender-light pr-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender-main text-lg font-semibold text-lavender-dark shadow-inner md:h-14 md:w-14">
                    {currentReview.name.charAt(0)}
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="truncate text-sm font-bold tracking-tight text-gray-900 sm:text-base">{currentReview.name}</h4>
                    <p className="mt-0.5 truncate text-[10px] font-semibold tracking-wide text-gray-400 sm:text-xs">{currentReview.date}</p>
                  </div>
                </div>

                <Link
                  href={`/products/${currentReview.productId}`}
                  className="group flex min-w-0 items-center justify-center gap-2.5 rounded-2xl bg-lavender-light/45 p-2 transition-colors hover:bg-lavender-light sm:gap-3 sm:px-3"
                >
                  {currentReview.productImage && (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-lavender-main shadow-sm md:h-14 md:w-14">
                      <Image
                        src={currentReview.productImage}
                        alt={currentReview.productName}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="text-[9px] font-semibold tracking-wide text-gray-400 sm:text-[10px]">Reviewed product</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-tight text-lavender-dark sm:text-sm">
                      {currentReview.productName}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Stars */}
              <div className="mb-4 mt-5 flex shrink-0 items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 md:h-6 md:w-6 ${
                      star <= currentReview.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-lavender-main'
                    } transition-all duration-300`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              {/* Review Comment */}
              <p className="min-h-0 flex-1 overflow-y-auto px-2 text-center text-base font-medium italic leading-relaxed text-gray-800 [scrollbar-width:thin] sm:text-lg md:px-8 md:text-xl">
                &quot;{currentReview.comment}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={prevSlide}
            className="w-12 h-12 rounded-full bg-white border-2 border-lavender-main hover:border-lavender-dark flex items-center justify-center transition-all hover:shadow-lg group"
            aria-label="Previous review"
          >
            <svg className="w-6 h-6 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Fixed-width counter keeps both navigation buttons anchored. */}
          <div className="flex h-10 w-28 items-center justify-center rounded-full bg-white text-xs font-bold tracking-wide text-lavender-dark shadow-sm ring-1 ring-lavender-main">
            {currentIndex + 1} / {reviews.length}
          </div>

          <button
            onClick={nextSlide}
            className="w-12 h-12 rounded-full bg-white border-2 border-lavender-main hover:border-lavender-dark flex items-center justify-center transition-all hover:shadow-lg group"
            aria-label="Next review"
          >
            <svg className="w-6 h-6 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Review Stats */}
        <div className="text-center">
          <p className="text-gray-400 text-xs font-semibold  tracking-wide">
            <span className="text-lavender-dark">{reviews.length}+</span> Customer Reviews
          </p>
        </div>
      </div>
    </section>
  );
}
