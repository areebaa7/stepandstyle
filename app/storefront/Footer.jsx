'use client';

import React from 'react';
import { MapPin, Phone, Clock, Mail, Globe, Share2, MessageCircle, Play } from 'lucide-react';
import './Footer.css';

export default function Footer({ setCurrentPage }) {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Column 1: Step&Styl Navigation */}
        <div className="footer-column">
          <h3 className="footer-heading">Step&Styl</h3>
          <ul className="footer-links">
            <li onClick={() => setCurrentPage('shop')}>Category</li>
            <li onClick={() => setCurrentPage('shop')}>New arrivals</li>
            <li onClick={() => setCurrentPage('shop')}>Sales</li>
            <li onClick={() => setCurrentPage('shop')}>Shop</li>
            <li onClick={() => setCurrentPage('shop')}>Contact us</li>
          </ul>
        </div>

        {/* Column 2: Information */}
        <div className="footer-column">
          <h3 className="footer-heading">Information</h3>
          <ul className="footer-links">
            <li onClick={() => window.open('https://wa.me/923329822592', '_blank')}>Contact Us</li>
            <li onClick={() => setCurrentPage('shipping-delivery')}>Shipping & Delivery</li>
            <li onClick={() => setCurrentPage('returns-exchanges')}>Returns & Exchanges</li>
          </ul>
        </div>

        {/* Column 3: Our Contacts & Socials */}
        <div className="footer-column">
          <h3 className="footer-heading">Our Contacts</h3>
          <ul className="footer-contact-list">
            <li>
              <MapPin size={16} className="contact-icon" />
              <span>Islamabad, Pakistan</span>
            </li>
            <li>
              <Phone size={16} className="contact-icon" />
              <span>+92 300 1234567</span>
            </li>
            <li>
              <Clock size={16} className="contact-icon" />
              <span>Mon - Fri: 10:00 - 18:00</span>
            </li>
            <li>
              <Mail size={16} className="contact-icon" />
              <span>support@stepandstyl.com</span>
            </li>
          </ul>

          <div className="footer-socials">
            <a href="#social" aria-label="Share" className="social-icon-btn"><Share2 size={18} /></a>
            <a href="#social" aria-label="Globe" className="social-icon-btn"><Globe size={18} /></a>
            <a href="#social" aria-label="Chat" className="social-icon-btn"><MessageCircle size={18} /></a>
            <a href="#social" aria-label="Media" className="social-icon-btn"><Play size={18} /></a>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="footer-bottom">
        <p>© 2026 Step&Styl. All rights reserved.</p>
      </div>
    </footer>
  );
}
