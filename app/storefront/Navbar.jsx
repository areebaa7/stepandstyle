'use client';

import React, { useState } from 'react';
import { User, ShoppingBag, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

export default function Navbar({ setCurrentPage, cartCount, onOpenCart, onOpenAuthModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const handleNavClick = (page, sectionId) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setCategoryDropdownOpen(false);

    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="navbar-wrapper">
      {/* Top Promotional Announcement Infinite Ticker Strip */}
      <div className="promo-ticker-strip">
        <div className="ticker-track">
          <span>FLASH SALE 40% OFF &bull; Live Sale</span>
          <span>FLASH SALE 40% OFF &bull; Live Sale</span>
          <span>FLASH SALE 40% OFF &bull; Live Sale</span>
          <span>FLASH SALE 40% OFF &bull; Live Sale</span>
          <span>FLASH SALE 40% OFF &bull; Live Sale</span>
          <span>FLASH SALE 40% OFF &bull; Live Sale</span>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          
          <div className="nav-left-group">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="nav-brand" onClick={() => handleNavClick('home')}>
              {/* Fixed: Using public string path directly */}
              <img src="/assets/step&styl-logo-new.png" alt="Step & Styl Logo" className="brand-logo-img" />
              <span className="brand-name">Step&Styl</span>
            </div>
          </div>

          <nav className="nav-links desktop-nav">
            <button onClick={() => handleNavClick('shop')} className="nav-link-btn">Shop</button>

            <div 
              className="dropdown-container"
              onMouseEnter={() => setCategoryDropdownOpen(true)}
              onMouseLeave={() => setCategoryDropdownOpen(false)}
            >
              <button className="nav-link-btn dropdown-trigger">
                Categories <ChevronDown size={14} />
              </button>
              {categoryDropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={() => handleNavClick('men')}>Men</button>
                  <button onClick={() => handleNavClick('women')}>Women</button>
                  <button onClick={() => handleNavClick('kids')}>Kids</button>
                </div>
              )}
            </div>

            <button onClick={() => handleNavClick('home', 'new-arrivals-section')} className="nav-link-btn">New Arrivals</button>
            <button onClick={() => handleNavClick('home', 'best-sellers-section')} className="sale-link">Sale</button>
          </nav>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav 
                className="nav-links mobile-open"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <button onClick={() => handleNavClick('shop')} className="nav-link-btn">Shop</button>
                <div className="mobile-category-group">
                  <span className="mobile-cat-title">Categories:</span>
                  <button onClick={() => handleNavClick('men')} className="sub-link">Men</button>
                  <button onClick={() => handleNavClick('women')} className="sub-link">Women</button>
                  <button onClick={() => handleNavClick('kids')} className="sub-link">Kids</button>
                </div>
                <button onClick={() => handleNavClick('home', 'new-arrivals-section')} className="nav-link-btn">New Arrivals</button>
                <button onClick={() => handleNavClick('home', 'best-sellers-section')} className="sale-link">Sale</button>
                <div className="mobile-auth-group" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={() => { onOpenAuthModal('login'); setMobileMenuOpen(false); }} className="nav-link-btn">Login</button>
                  <button onClick={() => { onOpenAuthModal('signup'); setMobileMenuOpen(false); }} className="nav-link-btn" style={{ background: '#1F2937', color: '#FFF', borderRadius: '4px', padding: '6px 12px' }}>Register</button>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>

          <div className="nav-actions">
            <button className="affiliate-btn" onClick={() => handleNavClick('affiliate')}>AFFILIATE</button>
            
            <button className="icon-btn" aria-label="Account" onClick={() => onOpenAuthModal('login')} title="Admin Login / Sign Up">
              <User size={20} />
            </button>

            <button className="icon-btn" aria-label="Cart" onClick={onOpenCart}>
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>

        </div>
      </nav>
    </header>
  );
}
