import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import SplashScreen from './SplashScreen';
import Hero from './Hero';
import NewArrivals from './NewArrivals';
import ForHerForHim from './ForHerForHim';
import BestSellers from './BestSellers';
import DiscoverMore from './DiscoverMore';
import CustomerReviews from './CustomerReviews';
import AffiliateSection from './AffiliateSection';
import AffiliatePage from './AffiliatePage';
import ShopPage from './ShopPage';
import WomenShopPage from './WomenShopPage';
import MenShopPage from './MenShopPage';
import KidsShopPage from './KidsShopPage';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';
import './index.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  
  // Global Cart State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');

  const handleOpenAuthModal = (tab = 'login') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handleAddToCart = (productWithSpecs) => {
    setCartItems(prev => {
      // Check if item with same ID, size, and color already exists
      const existingIndex = prev.findIndex(
        item => item.id === productWithSpecs.id && 
                item.selectedSize === productWithSpecs.selectedSize && 
                item.selectedColor === productWithSpecs.selectedColor
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += productWithSpecs.quantity;
        return updated;
      }
      return [...prev, productWithSpecs];
    });
    setIsCartOpen(true); // Automatically open slide-out cart drawer on add
  };

  const handleUpdateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    setCartItems(prev => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (currentPage === 'home') {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [currentPage]);

  return (
    <div className="ecommerce-container">
      <AnimatePresence>
        {showSplash && currentPage === 'home' && <SplashScreen />}
      </AnimatePresence>

      <Navbar 
        setCurrentPage={setCurrentPage} 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {currentPage === 'home' ? (
        <>
          <Hero setCurrentPage={setCurrentPage} />
          <div id="new-arrivals-section">
            <NewArrivals setCurrentPage={setCurrentPage} />
          </div>
          <ForHerForHim setCurrentPage={setCurrentPage} />
          <div id="best-sellers-section">
            <BestSellers setCurrentPage={setCurrentPage} />
          </div>
          <DiscoverMore setCurrentPage={setCurrentPage} />
          <AffiliateSection setCurrentPage={setCurrentPage} />
          <CustomerReviews />
        </>
      ) : currentPage === 'shop' ? (
        <ShopPage setCurrentPage={setCurrentPage} onAddToCart={handleAddToCart} />
      ) : currentPage === 'women' ? (
        <WomenShopPage onAddToCart={handleAddToCart} />
      ) : currentPage === 'men' ? (
        <MenShopPage onAddToCart={handleAddToCart} />
      ) : currentPage === 'kids' ? (
        <KidsShopPage onAddToCart={handleAddToCart} />
      ) : currentPage === 'affiliate' ? (
        <AffiliatePage />
      ) : (
        <div className="dynamic-page-view">
          <div className="page-header-banner">
            <h1 className="page-title">{currentPage.toUpperCase()} COLLECTION</h1>
            <p className="page-subtitle">Explore premium luxury items curated for {currentPage}.</p>
            <button className="btn-shop-now" onClick={() => setCurrentPage('home')}>Back to Home</button>
          </div>
        </div>
      )}

      {/* Slide-out Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Authentication Modal (Login / Sign Up) */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />

      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}