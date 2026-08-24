import React from 'react';
import './ForHerForHim.css';

// Import local images from your assets folder
import herImage from './assets/women-shoes.jpg';
import himImage from './assets/shoe-1.jpg';

export default function ForHerForHim({ setCurrentPage }) {
  return (
    <section className="gender-split-section">
      
      {/* FOR HER SIDE */}
      <div className="gender-banner her-banner" onClick={() => setCurrentPage('women')}>
        <div className="banner-image-wrapper">
          <img src={herImage} alt="For Her" className="banner-image" />
        </div>
        <div className="banner-overlay">
          <div className="banner-content">
            <h2 className="banner-title">FOR HER</h2>
            <div className="banner-btn-wrapper">
              <span className="banner-explore-btn">EXPLORE COLLECTION</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOR HIM SIDE */}
      <div className="gender-banner him-banner" onClick={() => setCurrentPage('men')}>
        <div className="banner-image-wrapper">
          <img src={himImage} alt="For Him" className="banner-image" />
        </div>
        <div className="banner-overlay">
          <div className="banner-content">
            <h2 className="banner-title">FOR HIM</h2>
            <div className="banner-btn-wrapper">
              <span className="banner-explore-btn">EXPLORE COLLECTION</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}