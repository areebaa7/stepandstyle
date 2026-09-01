import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import './ShopPage.css';

const kidsImages = import.meta.glob('./assets/Kids/*.{png,jpg,jpeg,webp}', { eager: true });

const kidsCatalog = Object.entries(kidsImages).map(([path, module], index) => {
  const mainImg = module.default;
  return {
    id: `kids-${index + 1}`,
    category: "Kids' Collection",
    title: `Junior Footwear Style ${index + 1}`,
    price: `${(3500 + index * 350).toLocaleString()} PKR`,
    originalPrice: `${(4500 + index * 400).toLocaleString()} PKR`,
    discount: '13% OFF',
    image: mainImg,
    images: [mainImg, mainImg, mainImg],
    colors: ['#1E90FF', '#FF6347', '#000000'],
    description: 'Designed specifically for active growing feet, featuring lightweight cushioning, flexible soles, and durable slip-resistant materials for all-day playground wear.',
  };
});

const fallbackKidsCatalog = [
  { id: 'k1', category: "Kids' Collection", title: 'Junior Play Sneaker-Blue', price: '3,900 PKR', originalPrice: '4,500 PKR', discount: '13% OFF', image: 'https://images.unsplash.com/photo-1514989940723-e8e5ef6ab5c4?q=80&w=800&auto=format&fit=crop', images: ['https://images.unsplash.com/photo-1514989940723-e8e5ef6ab5c4?q=80&w=800&auto=format&fit=crop'], colors: ['#1E90FF', '#FF6347'], description: 'Colorful active play sneaker with breathable mesh and velcro straps.' }
];

const finalKidsCatalog = kidsCatalog.length > 0 ? kidsCatalog : fallbackKidsCatalog;

export default function KidsShopPage({ onAddToCart }) {
  const [currentPage, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(finalKidsCatalog.length / itemsPerPage) || 1;
  const paginatedProducts = finalKidsCatalog.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        Kids' Collection
      </motion.h1>

      <div className="shop-filter-bar">
        <p className="results-count">Showing {finalKidsCatalog.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, finalKidsCatalog.length)} of {finalKidsCatalog.length} results</p>
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
            <button key={num} className={`page-btn ${currentPage === num ? 'active-page' : ''}`} onClick={() => setCurrentPageNum(num)}>
              {num}
            </button>
          ))}
          <button className="page-btn" onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}