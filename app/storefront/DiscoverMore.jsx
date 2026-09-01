'use client';

import React from 'react';
import { motion } from 'framer-motion';
import './DiscoverMore.css';

const discoverData = [
  {
    id: 1,
    tag: 'PRODUCT DEMONSTRATIONS',
    title: 'Formal Loafer Close-Up',
    description: 'A closer look at shape, finish and flexible everyday styling.',
    videoUrl: '/assets/men-shoe-add.mp4',
  },
  {
    id: 2,
    tag: 'TRENDING PRODUCTS',
    title: 'Midnight Style in Motion',
    description: 'An evening-ready silhouette from every angle.',
    videoUrl: '/assets/men-shoe-add.mp4',
  },
  {
    id: 3,
    tag: 'SHORT REELS',
    title: 'Occasion Edit',
    description: 'A quick campaign look at the latest collection.',
    videoUrl: '/assets/shoe-add.mp4',
  },
  {
    id: 4,
    tag: 'PRODUCT DEMONSTRATIONS',
    title: 'Everyday Comfort Detail',
    description: 'Soft structure and simple styling for repeat wear.',
    videoUrl: '/assets/kids-shoe-add.mp4',
  },
  {
    id: 5,
    tag: 'NEW COLLECTION',
    title: 'Signature Velvet Heel',
    description: 'Crafted for unmatched elegance and evening poise.',
    videoUrl: '/assets/men-shoe-add.mp4',
  },
];

export default function DiscoverMore({ setCurrentPage }) {
  // Duplicate data array to create a seamless infinite carousel loop effect
  const carouselItems = [...discoverData, ...discoverData];

  return (
    <section className="discover-more-section">
      
      {/* Header Heading & Subtext */}
      <div className="discover-header-container">
        <motion.span 
          className="discover-top-tagline"
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          STEP & STYLE IN MOTION
        </motion.span>
        
        <motion.h2 
          className="discover-main-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Watch. Discover. Shop.
        </motion.h2>

        <motion.p 
          className="discover-subtext"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Trending picks, honest customer moments and quick product demonstrations.
        </motion.p>
      </div>

      {/* Infinite Auto-Scrolling Carousel Container */}
      <div className="discover-carousel-container">
        <motion.div 
          className="discover-track"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 30,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {carouselItems.map((item, index) => (
            <div 
              key={`${item.id}-${index}`}
              className="discover-card"
              onClick={() => setCurrentPage('shop')}
            >
              {/* Background Running Video */}
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="discover-card-video"
              >
                <source src={item.videoUrl} type="video/mp4" />
              </video>

              {/* Dark Gradient Overlay */}
              <div className="discover-card-overlay">
                <div className="discover-card-content">
                  
                  <span className="discover-purple-tag">{item.tag}</span>
                  <h3 className="discover-card-title">{item.title}</h3>
                  <p className="discover-card-desc">{item.description}</p>

                  <button className="btn-discover-shop">
                    Shop now
                  </button>

                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
