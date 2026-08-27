import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import './ShopPage.css';

const casualImages = import.meta.glob('./assets/Men/casual/*.{png,jpg,jpeg,webp}', { eager: true });
const formalImages = import.meta.glob('./assets/Men/formal/*.{png,jpg,jpeg,webp}', { eager: true });
const sneakerImages = import.meta.glob('./assets/Men/sneaker/*.{png,jpg,jpeg,webp}', { eager: true });

const getProductsFromFolder = (globObj, subcategory) => {
  return Object.entries(globObj).map(([path, module], index) => {
    const mainImg = module.default;
    let desc = "Expertly engineered for everyday comfort and style.";
    if (subcategory === 'formal') {
      desc = "Handcrafted genuine leather formal oxford, designed for corporate meetings, weddings, and executive galas.";
    } else if (subcategory === 'sneakers') {
      desc = "Lightweight urban street sneaker featuring high-impact cushioning, breathable mesh, and flexible rubber soles.";
    } else if (subcategory === 'casual') {
      desc = "Relaxed slip-on loafer crafted with soft suede and ergonomic insoles for effortless weekend wear.";
    }

    return {
      id: `men-${subcategory}-${index + 1}`,
      subcategory,
      category: "Men's Collection",
      title: `Men's ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} ${index + 1}`,
      price: `${(6500 + index * 400).toLocaleString()} PKR`,
      originalPrice: `${(8000 + index * 500).toLocaleString()} PKR`,
      discount: '15% OFF',
      image: mainImg,
      images: [mainImg, mainImg, mainImg],
      colors: ['#000000', '#8B4513', '#FFFFFF'],
      colorVariants: [
        { color: '#000000', name: 'Classic Black', description: desc, images: [mainImg] },
        { color: '#8B4513', name: 'Rich Tan', description: 'Hand-finished rich tan leather treated with organic oils for a distinguished vintage appearance.', images: [mainImg] },
        { color: '#FFFFFF', name: 'Pure White', description: 'Clean minimal aesthetic matching modern streetwear trends.', images: [mainImg] }
      ],
      description: desc,
    };
  });
};

const dynamicMenCatalog = [
  ...getProductsFromFolder(casualImages, 'casual'),
  ...getProductsFromFolder(formalImages, 'formal'),
  ...getProductsFromFolder(sneakerImages, 'sneakers'),
];

const fallbackMenCatalog = [
  { id: 'm1', subcategory: 'sneakers', category: "Men's Collection", title: 'Urban Motion Sneaker-Black', price: '7,500 PKR', originalPrice: '8,900 PKR', discount: '15% OFF', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'], colors: ['#000000', '#FFFFFF'], description: 'Lightweight urban street sneaker with high-impact cushioning.' }
];

const menCatalog = dynamicMenCatalog.length > 0 ? dynamicMenCatalog : fallbackMenCatalog;

export default function MenShopPage({ onAddToCart }) {
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [currentPage, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const formalThumb = Object.keys(formalImages).length > 0 
    ? formalImages[Object.keys(formalImages)[0]].default 
    : menCatalog.find(i => i.subcategory === 'formal')?.image;

  const sneakerThumb = Object.keys(sneakerImages).length > 0 
    ? sneakerImages[Object.keys(sneakerImages)[0]].default 
    : menCatalog.find(i => i.subcategory === 'sneakers')?.image;

  const casualThumb = Object.keys(casualImages).length > 0 
    ? casualImages[Object.keys(casualImages)[0]].default 
    : menCatalog.find(i => i.subcategory === 'casual')?.image;

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
        Men's Collection
      </motion.h1>

      <div className="shop-categories-row">
        <div className={`category-circle-item ${activeSubcategory === 'all' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('all')}>
          <div className="circle-image-wrapper"><img src={formalThumb} alt="All Men" /></div>
          <span className="category-label">All Men</span>
        </div>
        <div className={`category-circle-item ${activeSubcategory === 'sneakers' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('sneakers')}>
          <div className="circle-image-wrapper"><img src={sneakerThumb} alt="Sneakers" /></div>
          <span className="category-label">Sneakers</span>
        </div>
        <div className={`category-circle-item ${activeSubcategory === 'formal' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('formal')}>
          <div className="circle-image-wrapper"><img src={formalThumb} alt="Formal" /></div>
          <span className="category-label">Formal</span>
        </div>
        <div className={`category-circle-item ${activeSubcategory === 'casual' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('casual')}>
          <div className="circle-image-wrapper"><img src={casualThumb} alt="Casual" /></div>
          <span className="category-label">Casual</span>
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results</p>
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