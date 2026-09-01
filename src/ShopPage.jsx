import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import './ShopPage.css';

// =========================================================================
// 1. CHANGE THESE TOP IMPORTS TO YOUR PREFERRED CATEGORY CIRCLE IMAGES
// =========================================================================
import allCategoryThumb from './assets/women-formal.jpg';
import womenCategoryThumb from './assets/Women/women-mustardshoes.jpeg';
import menCategoryThumb from './assets/Men/sneaker/sneaker-4.jpeg';
import kidsCategoryThumb from './assets/Kids/kids-2.jpeg';

// Automatically load all items from respective folders for the product catalog
const womenImages = import.meta.glob('./assets/Women/*.{png,jpg,jpeg,webp}', { eager: true });
const menImages = import.meta.glob('./assets/Men/*.{png,jpg,jpeg,webp}', { eager: true });
const kidsImages = import.meta.glob('./assets/Kids/*.{png,jpg,jpeg,webp}', { eager: true });

const getImagesFromGlob = (globObj, category) => {
  return Object.entries(globObj).map(([path, module], index) => {
    const mainImg = module.default;
    return {
      id: `${category}-${index + 1}`,
      category,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Luxury Footwear ${index + 1}`,
      price: `${(6000 + index * 450).toLocaleString()} PKR`,
      originalPrice: `${(7500 + index * 500).toLocaleString()} PKR`,
      discount: '15% OFF',
      image: mainImg,
      images: [mainImg, mainImg, mainImg],
      colors: ['#000000', '#F5DEB3', '#8B4513'],
      description: 'Crafted with premium materials for unmatched durability, everyday comfort, and timeless elegance.',
    };
  });
};

const productCatalog = [
  ...getImagesFromGlob(womenImages, 'women'),
  ...getImagesFromGlob(menImages, 'men'),
  ...getImagesFromGlob(kidsImages, 'kids'),
];

export default function ShopPage({ setCurrentPage, onAddToCart }) {
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(productCatalog.length / itemsPerPage) || 1;
  const paginatedProducts = productCatalog.slice((currentPageNum - 1) * itemsPerPage, currentPageNum * itemsPerPage);

  const handleCategoryClick = (cat) => {
    if (cat === 'women') setCurrentPage('women');
    if (cat === 'men') setCurrentPage('men');
    if (cat === 'kids') setCurrentPage('kids');
  };

  if (selectedProduct) {
    return (
      <ProductDetail 
        product={selectedProduct} 
        onBack={() => setSelectedProduct(null)} 
        onAddToCart={onAddToCart}
      />
    );
  }

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

      {/* Category Circle Selector using your custom top-imported images */}
      <div className="shop-categories-row">
        <div className="category-circle-item active" onClick={() => setCurrentPage('shop')}>
          <div className="circle-image-wrapper"><img src={allCategoryThumb} alt="All Shoes" /></div>
          <span className="category-label">All Shoes</span>
        </div>
        <div className="category-circle-item" onClick={() => handleCategoryClick('women')}>
          <div className="circle-image-wrapper"><img src={womenCategoryThumb} alt="Women" /></div>
          <span className="category-label">Women</span>
        </div>
        <div className="category-circle-item" onClick={() => handleCategoryClick('men')}>
          <div className="circle-image-wrapper"><img src={menCategoryThumb} alt="Men" /></div>
          <span className="category-label">Men</span>
        </div>
        <div className="category-circle-item" onClick={() => handleCategoryClick('kids')}>
          <div className="circle-image-wrapper"><img src={kidsCategoryThumb} alt="Kids" /></div>
          <span className="category-label">Kids</span>
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">Showing {(currentPageNum - 1) * itemsPerPage + 1}–{Math.min(currentPageNum * itemsPerPage, productCatalog.length)} of {productCatalog.length} results</p>
        <div className="filter-dropdown-btn"><span>Default sorting</span></div>
      </div>

      <div className="shop-products-grid">
        {paginatedProducts.map((product, index) => (
          <motion.div 
            key={product.id}
            className="shop-product-card"
            onClick={() => setSelectedProduct(product)}
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
            <button key={num} className={`page-btn ${currentPageNum === num ? 'active-page' : ''}`} onClick={() => setCurrentPageNum(num)}>
              {num}
            </button>
          ))}
          <button className="page-btn" onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))} disabled={currentPageNum === totalPages}>
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}