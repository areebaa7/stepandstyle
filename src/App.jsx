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
import './index.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showSplash, setShowSplash] = useState(true);

  // Trigger splash screen only on the landing/home page load
  useEffect(() => {
    if (currentPage === 'home') {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1800); // Splash screen displays for 1.8 seconds
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

      <Navbar setCurrentPage={setCurrentPage} />

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
        <ShopPage setCurrentPage={setCurrentPage} />
      ) : currentPage === 'women' ? (
        <WomenShopPage />
      ) : currentPage === 'men' ? (
        <MenShopPage />
      ) : currentPage === 'kids' ? (
        <KidsShopPage />
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

      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}