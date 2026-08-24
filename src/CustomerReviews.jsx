import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import './CustomerReviews.css';

// Import shoe images from women, men, and kids folders
import womenShoeImg from './assets/Women/women-mustardshoes.jpeg';
import menShoeImg from './assets/Men/formal/men-formal2.jpeg';
import kidsShoeImg from './assets/Kids/kids-1.jpeg';

const reviewsData = [
  {
    id: 1,
    quote: "Absolutely love these slip-ons! Super comfortable for everyday wear and the color is gorgeous.",
    name: "Gretchen Calzoni",
    rating: 5,
    shoeImg: womenShoeImg,
    shoeTitle: "Women Classic Slip-On",
  },
  {
    id: 2,
    quote: "Exceptional quality leather and very premium finish. Perfect for formal office wear and events.",
    name: "Lydia Dokidis",
    rating: 5,
    shoeImg: menShoeImg,
    shoeTitle: "Men Executive Oxford",
  },
  {
    id: 3,
    quote: "Very durable and lightweight. My kid loves wearing them all day without any complaints!",
    name: "Carla Ekstrom Bothman",
    rating: 4,
    shoeImg: kidsShoeImg,
    shoeTitle: "Kids Comfort Walker",
  },
];

const CustomerReviews = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === reviewsData.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviewsData.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === reviewsData.length - 1 ? 0 : prev + 1));
  };

  const currentReview = reviewsData[currentIndex];
  const prevIndex = currentIndex === 0 ? reviewsData.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === reviewsData.length - 1 ? 0 : currentIndex + 1;

  const leftReview = reviewsData[prevIndex];
  const rightReview = reviewsData[nextIndex];

  return (
    <section className="reviews-section">
      <div className="reviews-container">
        
        <h2 className="reviews-heading">Customer Reviews</h2>

        <div className="carousel-wrapper">
          
          <button className="carousel-arrow left-arrow" onClick={handlePrev} aria-label="Previous Review">
            <ChevronLeft size={20} />
          </button>

          <div className="carousel-track">
            
            <div className="side-card left-peek" onClick={handlePrev}>
              <p className="peek-quote">{leftReview.quote}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={currentReview.id}
                className="center-active-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="card-inner-white-frame">
                  
                  {/* Yellow Star Ratings */}
                  <div className="star-rating-container">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < currentReview.rating ? "#FBBF24" : "none"} 
                        stroke="#FBBF24" 
                        className="star-icon"
                      />
                    ))}
                  </div>

                  <blockquote className="center-quote">
                    "{currentReview.quote}"
                  </blockquote>

                  {/* Larger standalone product image without pill background or text */}
                  <div className="reviewed-shoe-image-wrapper">
                    <img src={currentReview.shoeImg} alt={currentReview.shoeTitle} className="reviewed-shoe-large-thumb" />
                  </div>
                  
                  <h4 className="center-name">{currentReview.name}</h4>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="side-card right-peek" onClick={handleNext}>
              <p className="peek-quote">{rightReview.quote}</p>
            </div>

          </div>

          <button className="carousel-arrow right-arrow" onClick={handleNext} aria-label="Next Review">
            <ChevronRight size={20} />
          </button>

        </div>

        {/* Small Circular Pagination Dots */}
        <div className="pagination-dots">
          {reviewsData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`dot ${currentIndex === idx ? 'active' : ''}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default CustomerReviews;