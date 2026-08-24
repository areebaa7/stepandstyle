import React from 'react';
import { motion } from 'framer-motion';
import './SplashScreen.css';

import logoImg from './assets/step&styl-logo.jpeg';

export default function SplashScreen() {
  return (
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
          <img src={logoImg} alt="Step & Styl" className="splash-logo" />
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
  );
}