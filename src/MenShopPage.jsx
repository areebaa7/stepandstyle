import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './ShopPage.css';

// Dynamically import images from each subfolder inside assets/men/
const casualImages = import.meta.glob('./assets/Men/casual/*.{png,jpg,jpeg,webp}', { eager: true });
const formalImages = import.meta.glob('./assets/Men/formal/*.{png,jpg,jpeg,webp}', { eager: true });
const sneakerImages = import.meta.glob('./assets/Men/sneaker/*.{png,jpg,jpeg,webp}', { eager: true });

// Helper to map imported glob objects into catalog products
const getProductsFromFolder = (globObj, subcategory) => {
  return Object.entries(globObj).map(([path, module], index) => ({
    id: `${subcategory}-${index + 1}`,
    subcategory,
    title: `Men's ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} ${index + 1}`,
    price: `${(6500 + index * 400).toLocaleString()} PKR`,
    originalPrice: `${(8000 + index * 500).toLocaleString()} PKR`,
    discount: '15% OFF',
    image: module.default,
    colors: ['#000000', '#8B4513', '#FFFFFF'],
  }));
};

const dynamicMenCatalog = [
  ...getProductsFromFolder(casualImages, 'casual'),
  ...getProductsFromFolder(formalImages, 'formal'),
  ...getProductsFromFolder(sneakerImages, 'sneakers'),
];

// Fallback demo data if asset folders are empty
const fallbackMenCatalog = [
  { id: 'm1', subcategory: 'sneakers', title: 'Urban Motion Sneaker-Black', price: '7,500 PKR', originalPrice: '8,900 PKR', discount: '15% OFF', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', colors: ['#000000', '#FFFFFF'] },
  { id: 'm2', subcategory: 'sneakers', title: 'Streetwear Runner-White', price: '7,900 PKR', originalPrice: '9,200 PKR', discount: '14% OFF', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop', colors: ['#FFFFFF', '#000000'] },
  { id: 'm3', subcategory: 'formal', title: 'Executive Oxford-Tan', price: '9,200 PKR', originalPrice: '10,500 PKR', discount: '12% OFF', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800&auto=format&fit=crop', colors: ['#8B4513', '#000000'] },
  { id: 'm4', subcategory: 'formal', title: 'Classic Derby Shoe-Black', price: '8,800 PKR', originalPrice: '9,900 PKR', discount: '11% OFF', image: 'https://images.unsplash.com/photo-1533867617858-e7d97e0afd8b?q=80&w=800&auto=format&fit=crop', colors: ['#000000'] },
  { id: 'm5', subcategory: 'casual', title: 'Relaxed Slip-On Loafer', price: '6,500 PKR', originalPrice: '7,500 PKR', discount: '13% OFF', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800&auto=format&fit=crop', colors: ['#D2B48C', '#5C4033'] },
  { id: 'm6', subcategory: 'casual', title: 'Everyday Comfort Slipper', price: '4,500 PKR', originalPrice: '5,200 PKR', discount: '13% OFF', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=800&auto=format&fit=crop', colors: ['#7F8C8D', '#000000'] },
];

const menCatalog = dynamicMenCatalog.length > 0 ? dynamicMenCatalog : fallbackMenCatalog;

export default function MenShopPage() {
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [currentPage, setCurrentPageNum] = useState(1);

  // Filter products based on selected subcategory circle
  const filtered = activeSubcategory === 'all'
    ? menCatalog
    : menCatalog.filter(item => item.subcategory === activeSubcategory);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPageNum(1);
  };

  // Preview thumbnails for circles (using folder images or fallbacks)
  const formalThumb = Object.keys(formalImages).length > 0 
    ? formalImages[Object.keys(formalImages)[0]].default 
    : menCatalog.find(i => i.subcategory === 'formal')?.image;

  const sneakerThumb = Object.keys(sneakerImages).length > 0 
    ? sneakerImages[Object.keys(sneakerImages)[0]].default 
    : menCatalog.find(i => i.subcategory === 'sneakers')?.image;

  const casualThumb = Object.keys(casualImages).length > 0 
    ? casualImages[Object.keys(casualImages)[0]].default 
    : menCatalog.find(i => i.subcategory === 'casual')?.image;

  return (
    <div className="shop-page-container">
      
      {/* Page Title in Brand Purple */}
      <motion.h1 
        className="shop-main-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Men's Collection
      </motion.h1>

      {/* Top Circular Category Selector (All uses formal image, then Sneakers, Formal, Casual) */}
      <div className="shop-categories-row">
        <div 
          className={`category-circle-item ${activeSubcategory === 'all' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('all')}
        >
          <div className="circle-image-wrapper">
            <img src={formalThumb} alt="All Men" />
          </div>
          <span className="category-label">All Men</span>
        </div>

        <div 
          className={`category-circle-item ${activeSubcategory === 'sneakers' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('sneakers')}
        >
          <div className="circle-image-wrapper">
            <img src={sneakerThumb} alt="Sneakers" />
          </div>
          <span className="category-label">Sneakers</span>
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

        <div 
          className={`category-circle-item ${activeSubcategory === 'casual' ? 'active' : ''}`}
          onClick={() => handleSubcategoryChange('casual')}
        >
          <div className="circle-image-wrapper">
            <img src={casualThumb} alt="Casual" />
          </div>
          <span className="category-label">Casual</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shop-filter-bar">
        <p className="results-count">
          Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
        </p>
        <div className="filter-dropdown-btn">
          <span>Default sorting</span>
        </div>
      </div>

      {/* Products Grid */}
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

            {/* Color Swatches */}
            <div className="shop-color-swatches">
              {product.colors.map((hex, idx) => (
                <span 
                  key={idx} 
                  className="shop-swatch-dot" 
                  style={{ backgroundColor: hex }}
                />
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

      {/* Pagination Bar */}
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