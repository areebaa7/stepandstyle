'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

export default function SplashScreen({ onComplete = () => {} }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 1.8 seconds (giving time for the animation to play)
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="splash-screen-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="splash-content">
            <motion.div 
              className="splash-logo-wrapper"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Fixed: using clean public string path */}
              <img src="/assets/step&styl-logo.jpeg" alt="Step & Styl" className="splash-logo" />
            </motion.div>

            <motion.h1 
              className="splash-brand-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Step&Styl
            </motion.h1>

            <motion.div 
              className="splash-loader-bar"
              initial={{ width: 0 }}
              animate={{ width: "120px" }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
