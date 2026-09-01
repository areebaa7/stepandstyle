'use client';

import React from 'react';
import { motion } from 'framer-motion';
import './BestSellers.css';

const bestSellersData = [
  {
    id: 1,
    title: 'Comfort Slip On IK0102-Beige',
    salePrice: '7,950 PKR',
    salePrice: '5,565 PKR',
    discount: '30% OFF',
    image: '/assets/women-mustardshoes.jpeg',
    colors: ['#F5DEB3'],
  },
  {
    id: 2,
    title: 'Formal Sandal IF2074-Black',
    salePrice: '9,950 PKR',
    salePrice: '6,965 PKR',
    discount: '30% OFF',
    image: '/assets/women-lilac-shoes.jpeg',
    colors: ['#000000', '#2C3E50', '#E5E7EB'],
  },
  {
    id: 3,
    title: 'Party Wear Sandal IP2073-Gold',
    salePrice: '10,950 PKR',
    salePrice: '7,665 PKR',
    discount: '30% OFF',
    image: '/assets/women-pink2.jpeg',
    colors: ['#D4AF37', '#7F8C8D'],
  },
  {
    id: 4,
    title: 'Formal Sandal IF2074-Champagne',
    salePrice: '9,950 PKR',
    salePrice: '6,965 PKR',
    discount: '30% OFF',
    image: '/assets/men-formal3.jpeg',
    colors: ['#FFFFFF', '#000000'],
  },
];

export default function BestSellers({ setCurrentPage }) {
  return (
    <motion.section 
      className="best-sellers-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Best In What's New
      </motion.h2>

      <div className="best-sellers-grid">
        {bestSellersData.map((product, index) => (
          <motion.div 
            key={product.id} 
            className="product-card" 
            onClick={() => setCurrentPage('shop')}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
          >
            <div className="product-image-container">
              <span className="product-discount-badge">{product.discount}</span>
              <img src={product.image} alt={product.title} className="product-image" />
            </div>

            <div className="product-colors">
              {product.colors.map((colorHex, idx) => (
                <span
                  key={idx}
                  className="color-swatch"
                  style={{ backgroundColor: colorHex }}
                />
              ))}
            </div>

            <h3 className="product-name">{product.title}</h3>
            
            <div className="product-pricing">
              <span className="original-price">{product.salePrice}</span>
              <span className="sale-price">{product.salePrice}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="best-sellers-btn-container">
        <motion.button 
          className="btn-view-all" 
          onClick={() => setCurrentPage('shop')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          View all
        </motion.button>
      </div>
    </motion.section>
  );
}
