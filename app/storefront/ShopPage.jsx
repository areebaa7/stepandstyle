'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import { fetchProducts } from './utils/shopApi';
import './ShopPage.css';

export default function ShopPage({ setCurrentPage, onAddToCart }) {
  const [productCatalog, setProductCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoading(true);
      const fetched = await fetchProducts(); // Fetches all products from database backend
      if (isMounted) {
        setProductCatalog(fetched);
        setLoading(false);
      }
    }
    loadCatalog();
    return () => { isMounted = false; };
  }, []);

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

      {/* Category Circle Selector */}
      <div className="shop-categories-row">
        <div className="category-circle-item active" onClick={() => setCurrentPage('shop')}>
          <div className="circle-image-wrapper"><img src="/assets/women-formal.jpg" alt="All Shoes" /></div>
          <span className="category-label">All Shoes</span>
        </div>
        <div className="category-circle-item" onClick={() => handleCategoryClick('women')}>
          <div className="circle-image-wrapper"><img src="/assets/women-mustardshoes.jpeg" alt="Women" /></div>
          <span className="category-label">Women</span>
        </div>
        <div className="category-circle-item" onClick={() => handleCategoryClick('men')}>
          <div className="circle-image-wrapper"><img src="/assets/sneaker-4.jpeg" alt="Men" /></div>
          <span className="category-label">Men</span>
        </div>
        <div className="category-circle-item" onClick={() => handleCategoryClick('kids')}>
          <div className="circle-image-wrapper"><img src="/assets/kids-2.jpeg" alt="Kids" /></div>
          <span className="category-label">Kids</span>
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">
          Showing {productCatalog.length > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPageNum * itemsPerPage, productCatalog.length)} of {productCatalog.length} results
        </p>
        <div className="filter-dropdown-btn"><span>Default sorting</span></div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>Loading catalog from database...</div>
      ) : productCatalog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>No products found. Add products in your admin panel!</div>
      ) : (
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
                {product.discount && <span className="shop-discount-tag">{product.discount}</span>}
                <img src={product.image} alt={product.title} />
              </div>
              <div className="shop-color-swatches">
                {product.colors.map((hex, idx) => (
                  <span key={idx} className="shop-swatch-dot" style={{ backgroundColor: hex || '#1F2937' }} />
                ))}
              </div>
              <h3 className="shop-product-title">{product.title}</h3>
              <div className="shop-pricing-box">
                {product.formattedOriginalPrice && <span className="shop-original-price">{product.formattedOriginalPrice}</span>}
                <span className="shop-sale-price">{product.formattedPrice}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
