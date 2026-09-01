import React from 'react';
import { motion } from 'framer-motion';
import './AffiliateSection.css';

export default function AffiliateSection({ setCurrentPage }) {
  return (
    <section className="affiliate-section">
      <div className="affiliate-container">
        
        {/* Section Header Heading */}
        <div className="affiliate-section-header">
          <h2 className="affiliate-section-main-heading">Join Affiliate</h2>
        </div>

        {/* Full-width Luxury Card with Background Image */}
        <motion.div 
          className="affiliate-luxury-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="affiliate-card-overlay">
            
            <div className="affiliate-card-content">
              
              {/* Highlighted Commission Tag */}
              <motion.div 
                className="affiliate-highlight-tag"
                initial={{ opacity: 0, y: -15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span>Up To 15% Commission</span>
              </motion.div>

              <motion.h3 
                className="affiliate-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Join the <br />
                <span>Elite Affiliate</span> Network
              </motion.h3>

              <motion.p 
                className="affiliate-description"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Partner with Step & Styl and earn premium commissions on every sale you refer. High conversion rates & dedicated support.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.button 
                  className="btn-apply-now"
                  onClick={() => setCurrentPage('affiliate')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Apply Now
                </motion.button>
              </motion.div>

            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}