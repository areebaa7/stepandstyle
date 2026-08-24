import React from 'react';
import { motion } from 'framer-motion';
import './NewArrivals.css';

// Import local images from your assets folder
import item1 from './assets/shoe-2.jpeg';
import item2 from './assets/shoe-6.jpg';
import item3 from './assets/shoe-7.jpg';
import item4 from './assets/Men/sneaker/sneaker-4.jpeg';

const newArrivalsData = [
  { id: 1, title: 'Floral Strappy Sandal', image: item1 },
  { id: 2, title: 'Buckle Casual Slide', image: item2 },
  { id: 3, title: 'Minimalist Shoulder Bag', image: item3 },
  { id: 4, title: 'Signature Fragrance', image: item4 },
];

export default function NewArrivals({ setCurrentPage }) {
  return (
    <motion.section 
      className="new-arrivals-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
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
        {newArrivalsData.map((item, index) => (
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
    </motion.section>
  );
}