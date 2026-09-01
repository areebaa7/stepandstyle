'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Hero.css';

const heroMedia = [
  {
    type: 'video',
    url: '/assets/shoe-add.mp4',
    title: 'UP TO 50% OFF',
    subtitle: 'ON EVERYTHING',
    tagline1: 'SEASON END SALE',
    tagline2: 'IN-STORES & ONLINE',
  },
  {
    type: 'image',
    url: '/assets/women-shoes2.jpg',
    title: 'THE ART OF WALKING',
    subtitle: 'LUXURY COLLECTION',
    tagline1: 'TIMELESS ELEGANCE',
    tagline2: 'CRAFTED FOR PERFECTION',
  },
  {
    type: 'image',
    url: '/assets/women-shoes1.jpg',
    title: 'STEP INTO ELEGANCE',
    subtitle: 'EXCLUSIVE FOOTWEAR',
    tagline1: 'BOLD DESIGNS',
    tagline2: 'LIMITED EDITION',
  },
];

export default function Hero({ setCurrentPage }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMedia.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentMedia = heroMedia[currentIndex];

  return (
    <section className="hero-section">
      <div className="hero-slide active">
        {currentMedia.type === 'video' ? (
          <video autoPlay loop muted playsInline className="hero-media" key={currentMedia.url}>
            <source src={currentMedia.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img src={currentMedia.url} alt={currentMedia.title} className="hero-media" />
        )}

        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-text-group">
              
              {/* Framer Motion Animated Text Sequence */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <h1 className="hero-title">
                    {currentMedia.title} <br />
                    <span className="hero-subtitle-text">{currentMedia.subtitle}</span>
                  </h1>

                  <div className="hero-editorial-tags">
                    <span>{currentMedia.tagline1}</span>
                    <span className="dot-separator">•</span>
                    <span>{currentMedia.tagline2}</span>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="hero-buttons">
                <motion.button 
                  className="btn-shop-now" 
                  onClick={() => setCurrentPage('shop')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  SHOP NOW
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Carousel Indicator Dots */}
      <div className="carousel-dots">
        {heroMedia.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`dot ${currentIndex === index ? 'active' : ''}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
