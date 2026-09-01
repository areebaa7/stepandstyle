'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollAnimateProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-in-left' | 'slide-in-right' | 'scale-in';
  delay?: string;
  className?: string;
  threshold?: number;
}

export default function ScrollAnimate({
  children,
  animation = 'fade-in',
  delay = '0s',
  className = '',
  threshold = 0.1,
}: ScrollAnimateProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Responsive IntersectionObserver settings for mobile and desktop
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const rootMargin = isMobile ? '0px 0px -30px 0px' : '0px 0px -50px 0px';
    const effectiveThreshold = isMobile ? 0.05 : threshold;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optionally unobserve after animation triggers
          observer.unobserve(element);
        }
      },
      {
        threshold: effectiveThreshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? `animate-${animation}` : ''} ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

