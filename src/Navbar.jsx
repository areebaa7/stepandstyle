import React, { useState } from 'react';
import { User, Heart, ShoppingBag, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

// Import local logo asset
import logoImg from './assets/step&styl-logo-new.png'; 

export default function Navbar({ setCurrentPage }) {
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
    <header className="navbar">
      <div className="navbar-container">
        
        {/* Left Side: Hamburger & Brand Logo with Styled Text */}
        <div className="nav-left-group">
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="nav-brand" onClick={() => handleNavClick('home')}>
            <img src={logoImg} alt="Step & Styl Logo" className="brand-logo-img" />
            <span className="brand-name">Step&Styl</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav">
          <button onClick={() => handleNavClick('shop')} className="nav-link-btn">Shop</button>

          {/* Category Dropdown */}
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

        {/* Mobile Animated Dropdown Drawer */}
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
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Right Action Icons & Affiliate Button */}
        <div className="nav-actions">
          <button className="affiliate-btn" onClick={() => handleNavClick('affiliate')}>AFFILIATE</button>
          <button className="icon-btn desktop-only" aria-label="Account"><User size={20} /></button>
          <button className="icon-btn" aria-label="Wishlist"><Heart size={20} /></button>
          <button className="icon-btn" aria-label="Cart">
            <ShoppingBag size={20} />
            <span className="cart-badge">0</span>
          </button>
        </div>

      </div>
    </header>
  );
}