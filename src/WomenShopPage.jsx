import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import './ShopPage.css';

// =========================================================================
// 1. EDIT THESE IMPORTS TO CHANGE YOUR CATEGORY CIRCLE IMAGES EASILY
// =========================================================================
import allWomenCircleImg from './assets/shoe-7.jpeg';
import casualCircleImg from './assets/shoe-2.jpeg';
import bridalCircleImg from './assets/shoe-5.jpg';
import formalCircleImg from './assets/women-formal.jpg';

// Automatically load all images dynamically from the assets/Women folder
const womenImages = import.meta.glob('./assets/Women/*.{png,jpg,jpeg,webp}', { eager: true });
const womenImageList = Object.entries(womenImages).map(([path, mod]) => ({
  path: path.toLowerCase(),
  url: mod.default
}));

// Fallback thumbnails if the folder is empty
import formalThumb from './assets/women-formal.jpg';
import casualThumb from './assets/shoe-2.jpeg';
import bridalThumb from './assets/shoe-5.jpg';

// =========================================================================
// 2. DYNAMIC CATALOG MAPPING ALL IMAGES FROM THE WOMEN FOLDER
// =========================================================================
const customWomenCatalog = womenImageList.map(({ path, url }, index) => {
  let subcategory = 'formal';
  let title = `Women's Luxury Footwear ${index + 1}`;
  let description = "Crafted with premium materials for unmatched durability and everyday comfort.";
  let price = `${(6000 + index * 350).toLocaleString()} PKR`;
  let originalPrice = `${(7500 + index * 400).toLocaleString()} PKR`;

  // Tailor specific details based on filename keywords or index positions
  if (path.includes('pink-braided') || path.includes('pink')) {
    subcategory = 'casual';
    title = 'Pink Braided Glitter Flat Slipper';
    description = 'Step into effortless summer elegance with these chic pink braided flat slide sandals. Featuring a beautifully hand-woven lattice strap intertwined with shimmering glitter metallic accents, they deliver the perfect balance of sparkle and casual style. The soft, cushioned smooth footbed and slip-on construction ensure all-day comfort, making them your go-to choice for casual outings, beach days, or summer gatherings.';
  } else if (path.includes('lilac') || path.includes('shimmer') || path.includes('block')) {
    subcategory = 'formal';
    title = 'Midnight Shimmer Block';
    description = 'Step into the intersection of edgy modernism and evening glamour with the Midnight Shimmer Block. This design breaks away from traditional silhouettes by pairing a chunky, commanding platform with delicate, light-catching textures. It is designed for the woman who wants to stand tall and make a statement without saying a word. This sandal is the ultimate "day-to-night" transition piece.';
  } else if (path.includes('golden') || path.includes('bow') || path.includes('wedge')) {
    subcategory = 'bridal';
    title = 'Royal Golden Bow Wedge Slippers';
    price = '1,620 PKR';
    originalPrice = '1,800 PKR';
    description = 'Step into elegance with the StepAndStyl Royal Golden Bow Wedge Slippers, designed to add luxury and comfort to your everyday and festive wardrobe. Featuring a sophisticated glitter-finish wedge heel, premium golden metallic detailing, and a statement bow embellishment.';
  } else if (path.includes('mustard') || path.includes('sandal')) {
    subcategory = 'casual';
    title = 'Mustard Woven Lattice Sandal';
    description = 'Embrace warm-weather sophistication with these rich mustard woven lattice sandals. Featuring intricate braided straps interwoven with glittering metallic threads.';
  } else if (path.includes('sandal') || path.includes('cork')) {
    subcategory = 'casual';
    title = 'Ergonomic Cork Dual-Buckle Slide';
    description = 'Engineered for supreme orthopedic support, this dual-buckle slide features an authentic molded cork footbed lined with soft suede and adjustable metallic pin buckles.';
  } else if (path.includes('slipper') || path.includes('sat')) {
    subcategory = 'casual';
    title = 'Bloomsbury Pleated Satin Slide';
    description = 'Plush and feminine, the Bloomsbury slide features ruffled pleated satin fabric patterned with delicate vintage florals.';
  } else {
    subcategory = index % 3 === 0 ? 'casual' : index % 3 === 1 ? 'bridal' : 'formal';
    title = `Women's Elegance Edition ${index + 1}`;
  }

  // Create scrollable multi-image array using other available images in the folder
  const secondaryImg1 = womenImageList[(index + 1) % womenImageList.length]?.url || casualThumb;
  const secondaryImg2 = womenImageList[(index + 2) % womenImageList.length]?.url || bridalThumb;

  return {
    id: `women-item-${index + 1}`,
    subcategory,
    category: "Women's Collection",
    title,
    price,
    originalPrice,
    discount: '15% OFF',
    image: url, // Main thumbnail shown in grid
    images: [url, secondaryImg1, secondaryImg2], // Scrollable gallery images for ProductDetail
    colors: ['#000000', '#F5DEB3', '#D4AF37'],
    description,
    details: {
      embellishment: 'Handset Crystals & Premium Metallic Accents',
      heelType: subcategory === 'bridal' ? 'Wedge / Stiletto' : 'Flat Comfort Sole',
      heelHeight: subcategory === 'bridal' ? '2.5 inches' : '≤ 1 inch',
      liningMaterial: 'Smooth Synthetic PU Leather',
      shoeSole: 'Flexible Non-Slip PVC / Rubber',
      upperMaterial: 'Premium Synthetic Leather & Textile'
    },
    colorVariants: [
      { color: '#000000', name: 'Jet Black', description: 'Classic finish tailored for versatile styling.', images: [url, secondaryImg1] },
      { color: '#F5DEB3', name: 'Nude Beige', description: 'Soft neutral shade for day-to-night elegance.', images: [secondaryImg1, url] }
    ]
  };
});

export default function WomenShopPage({ onAddToCart }) {
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [currentPage, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filtered = activeSubcategory === 'all'
    ? customWomenCatalog
    : customWomenCatalog.filter(item => item.subcategory === activeSubcategory);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPageNum(1);
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
        Women's Collection
      </motion.h1>

      {/* Category Circle Selector using custom top-imported images */}
      <div className="shop-categories-row">
        <div className={`category-circle-item ${activeSubcategory === 'all' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('all')}>
          <div className="circle-image-wrapper"><img src={allWomenCircleImg} alt="All Women" /></div>
          <span className="category-label">All Women</span>
        </div>
        <div className={`category-circle-item ${activeSubcategory === 'casual' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('casual')}>
          <div className="circle-image-wrapper"><img src={casualCircleImg} alt="Casual" /></div>
          <span className="category-label">Casual</span>
        </div>
        <div className={`category-circle-item ${activeSubcategory === 'bridal' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('bridal')}>
          <div className="circle-image-wrapper"><img src={bridalCircleImg} alt="Bridal" /></div>
          <span className="category-label">Bridal</span>
        </div>
        <div className={`category-circle-item ${activeSubcategory === 'formal' ? 'active' : ''}`} onClick={() => handleSubcategoryChange('formal')}>
          <div className="circle-image-wrapper"><img src={formalCircleImg} alt="Formal" /></div>
          <span className="category-label">Formal</span>
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