import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './ShopPage.css';

const womenImages = import.meta.glob('./assets/women/*.{png,jpg,jpeg,webp}', { eager: true });
const menImages = import.meta.glob('./assets/men/*.{png,jpg,jpeg,webp}', { eager: true });
const kidsImages = import.meta.glob('./assets/kids/*.{png,jpg,jpeg,webp}', { eager: true });

const getImagesFromGlob = (globObj, category) => {
  return Object.entries(globObj).map(([path, module], index) => ({
    id: `${category}-${index + 1}`,
    category,
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Luxury Footwear ${index + 1}`,
    price: `${(6000 + index * 450).toLocaleString()} PKR`,
    originalPrice: `${(7500 + index * 500).toLocaleString()} PKR`,
    discount: '15% OFF',
    image: module.default,
    colors: ['#000000', '#F5DEB3', '#8B4513'],
  }));
};

const productCatalog = [
  ...getImagesFromGlob(womenImages, 'women'),
  ...getImagesFromGlob(menImages, 'men'),
  ...getImagesFromGlob(kidsImages, 'kids'),
];

export default function ShopPage({ setCurrentPage }) {
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(productCatalog.length / itemsPerPage) || 1;
  const paginatedProducts = productCatalog.slice((currentPageNum - 1) * itemsPerPage, currentPageNum * itemsPerPage);

  const handleCategoryClick = (cat) => {
    if (cat === 'women') setCurrentPage('women');
    if (cat === 'men') setCurrentPage('men');
    if (cat === 'kids') setCurrentPage('kids');
  };

  const allCircleImage = Object.values(womenImages)[0]?.default || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=400';
  const womenThumb = Object.values(womenImages)[0]?.default || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=400';
  const menThumb = Object.values(menImages)[0]?.default || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400';
  const kidsThumb = Object.values(kidsImages)[0]?.default || 'https://images.unsplash.com/photo-1514989940723-e8e5ef6ab5c4?q=80&w=400';

  return (
    <div className="shop-page-container">
      <motion.h1 
        className="shop-main-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Shop Collection
      </motion.h1>

      {/* Main Shop Categories (All, Women, Men, Kids) */}
      <div className="shop-categories-row">
        <div className="category-circle-item active" onClick={() => setCurrentPage('shop')}>
          <div className="circle-image-wrapper">
            <img src={allCircleImage} alt="All Shoes" />
          </div>
          <span className="category-label">All Shoes</span>
        </div>

        <div className="category-circle-item" onClick={() => handleCategoryClick('women')}>
          <div className="circle-image-wrapper">
            <img src={womenThumb} alt="Women" />
          </div>
          <span className="category-label">Women</span>
        </div>

        <div className="category-circle-item" onClick={() => handleCategoryClick('men')}>
          <div className="circle-image-wrapper">
            <img src={menThumb} alt="Men" />
          </div>
          <span className="category-label">Men</span>
        </div>

        <div className="category-circle-item" onClick={() => handleCategoryClick('kids')}>
          <div className="circle-image-wrapper">
            <img src={kidsThumb} alt="Kids" />
          </div>
          <span className="category-label">Kids</span>
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">Showing {(currentPageNum - 1) * itemsPerPage + 1}–{Math.min(currentPageNum * itemsPerPage, productCatalog.length)} of {productCatalog.length} results</p>
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
              className={`page-btn ${currentPageNum === num ? 'active-page' : ''}`}
              onClick={() => setCurrentPageNum(num)}
            >
              {num}
            </button>
          ))}
          <button 
            className="page-btn" 
            onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPageNum === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}