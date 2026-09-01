'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './NewArrivals.css';

const fallbackPlaceholders = [
  { id: 1, title: 'Premium Comfort Collection', image: '/assets/shoe-2.jpeg' },
  { id: 2, title: 'Everyday Essentials', image: '/assets/shoe-6.jpg' },
  { id: 3, title: 'Signature Style', image: '/assets/shoe-7.jpeg' },
  { id: 4, title: 'Modern Activewear', image: '/assets/sneaker-4.jpeg' },
];

export default function NewArrivals({ setCurrentPage }) {
  const [products, setProducts] = useState(fallbackPlaceholders);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch('/api/products?limit=4&sort=newest');
        const data = await response.json();
        if (response.ok && data.data && data.data.length >= 4) {
          setProducts(data.data.slice(0, 4).map(p => ({
            id: p.id,
            title: p.title || 'Premium Style',
            image: (p.images && p.images[0]) || fallbackPlaceholders[0].image
          })));
        }
      } catch (err) {
        console.error('Failed to fetch new arrivals', err);
      }
    };
    fetchNewArrivals();
  }, []);

  return (
    <section className="new-arrivals-section">
      {/* Section Title */}
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        New Arrivals
      </motion.h2>

      {/* 4-Column Grid */}
      <div className="arrivals-grid">
        {products.map((item, index) => (
          <motion.div 
            key={item.id} 
            className="arrival-card" 
            onClick={() => setCurrentPage('shop')}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
            whileHover={{ y: -6 }}
          >
            <div className="arrival-image-wrapper">
              <img src={item.image} alt={item.title} className="arrival-image" />
            </div>
            <h3 className="arrival-title">{item.title}</h3>
          </motion.div>
        ))}
      </div>

      {/* Discover All Button */}
      <div className="arrivals-button-container">
        <motion.button 
          className="btn-discover-all" 
          onClick={() => setCurrentPage('shop')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          DISCOVER ALL
        </motion.button>
      </div>
    </section>
  );
}
