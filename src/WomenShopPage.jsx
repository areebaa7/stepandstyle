import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './ShopPage.css';

// Using Vite's import.meta.glob to dynamically load images from the local assets/women folder
const womenImages = import.meta.glob('./assets/women/*.{png,jpg,jpeg,webp}', { eager: true });

// Direct asset imports for the specific subcategory circles
import casualThumb from './assets/shoe-2.jpeg';
import bridalThumb from './assets/shoe-5.jpg';
import formalThumb from './assets/women-formal.jpg';

// Convert local glob imports into structured catalog items
const womenCatalog = Object.entries(womenImages).map(([path, module], index) => {
  const lowerPath = path.toLowerCase();
  let subcategory = 'formal';
  if (lowerPath.includes('bridal') || lowerPath.includes('wedding') || lowerPath.includes('shoe-5')) {
    subcategory = 'bridal';
  } else if (lowerPath.includes('casual') || lowerPath.includes('sandal') || lowerPath.includes('slide') || lowerPath.includes('shoe-2')) {
    subcategory = 'casual';
  } else if (lowerPath.includes('formal') || lowerPath.includes('women-formal')) {
    subcategory = 'formal';
  }

  return {
    id: `w-${index + 1}`,
    subcategory,
    title: `Women's Luxury Footwear ${index + 1}`,
    price: `${(6500 + index * 400).toLocaleString()} PKR`,
    originalPrice: `${(8000 + index * 500).toLocaleString()} PKR`,
    discount: '15% OFF',
    image: module.default,
    colors: ['#000000', '#F5DEB3', '#D4AF37'],
  };
});

// Fallback items if folder is empty
const fallbackWomenCatalog = [
  { id: 'w1', subcategory: 'casual', title: 'Comfort Slide-Tea Pink', price: '4,500 PKR', originalPrice: '5,200 PKR', discount: '13% OFF', image: casualThumb, colors: ['#FFC0CB', '#F5DEB3'] },
  { id: 'w2', subcategory: 'bridal', title: 'Royal Crystal Bridal Heel-Gold', price: '12,500 PKR', originalPrice: '14,500 PKR', discount: '14% OFF', image: bridalThumb, colors: ['#D4AF37', '#FFFFFF'] },
  { id: 'w3', subcategory: 'formal', title: 'Velvet Evening Pump-Burgundy', price: '6,800 PKR', originalPrice: '7,900 PKR', discount: '14% OFF', image: formalThumb, colors: ['#800020', '#000000'] },
];

const finalWomenCatalog = womenCatalog.length > 0 ? womenCatalog : fallbackWomenCatalog;

export default function WomenShopPage() {
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [currentPage, setCurrentPageNum] = useState(1);

  const filtered = activeSubcategory === 'all'
    ? finalWomenCatalog
    : finalWomenCatalog.filter(item => item.subcategory === activeSubcategory);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPageNum(1);
  };

  // Grab the first image from the women folder for the "All" circle thumbnail
  const allThumb = Object.values(womenImages)[0]?.default || casualThumb;

  return (
    <div className="shop-page-container">
      <motion.h1 
        className="shop-main-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Women's Collection
      </motion.h1>

      {/* Top Circular Category Selector (All, Casual, Bridal, Formal) */}
      <div className="shop-categories-row">
        <div 
          className={`category-circle-item ${activeSubcategory === 'all' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('all')}
        >
          <div className="circle-image-wrapper">
            <img src={allThumb} alt="All Women" />
          </div>
          <span className="category-label">All Women</span>
        </div>

        <div 
          className={`category-circle-item ${activeSubcategory === 'casual' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('casual')}
        >
          <div className="circle-image-wrapper">
            <img src={casualThumb} alt="Casual" />
          </div>
          <span className="category-label">Casual</span>
        </div>

        <div 
          className={`category-circle-item ${activeSubcategory === 'bridal' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('bridal')}
        >
          <div className="circle-image-wrapper">
            <img src={bridalThumb} alt="Bridal" />
          </div>
          <span className="category-label">Bridal</span>
        </div>

        <div 
          className={`category-circle-item ${activeSubcategory === 'formal' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('formal')}
        >
          <div className="circle-image-wrapper">
            <img src={formalThumb} alt="Formal" />
          </div>
          <span className="category-label">Formal</span>
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">
          Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
        </p>
        <div className="filter-dropdown-btn">
          <span>Default sorting</span>
        </div>
      </div>

      <div className="shop-products-grid">
        {paginatedProducts.map((product, index) => (
          <motion.div 
            key={product.id}
            className="shop-product-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <div className="shop-image-box">
              <span className="shop-discount-tag">{product.discount}</span>
              <img src={product.image} alt={product.title} />
            </div>

            <div className="shop-color-swatches">
              {product.colors.map((hex, idx) => (
                <span key={idx} className="shop-swatch-dot" style={{ backgroundColor: hex }} />
              ))}
            </div>

            <h3 className="shop-product-title">{product.title}</h3>

            <div className="shop-pricing-box">
              <span className="shop-original-price">{product.originalPrice}</span>
              <span className="shop-sale-price">{product.price}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="shop-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button 
              key={num} 
              className={`page-btn ${currentPage === num ? 'active-page' : ''}`}
              onClick={() => setCurrentPageNum(num)}
            >
              {num}
            </button>
          ))}
          <button 
            className="page-btn" 
            onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}