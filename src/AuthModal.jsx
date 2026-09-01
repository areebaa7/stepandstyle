import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldKeyhole } from 'lucide-react';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab if props change
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAdminKey, setHasAdminKey] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'signup' && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert(`${activeTab === 'login' ? 'Logged in' : 'Registered'} successfully!`);
    onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div 
        className="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-tabs">
          <button 
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`} 
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`} 
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-form-scroll-area">
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>Welcome Back</h2>
              <p className="auth-subtitle">Access your account to complete purchases or manage orders.</p>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit-btn">Login</button>
              
              <p className="auth-terms">
                By continuing you agree to our <strong>terms of service</strong>. Users can browse products without logging in, but an account is required for purchases or admin access.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>Create Account</h2>
              <p className="auth-subtitle">Join Step&Styl for checkout and exclusive offers.</p>

              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Areeba Sundal" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Create a strong password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="password-hint">Use at least 8 characters combining letters and numbers.</span>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Re-enter your password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={hasAdminKey} 
                    onChange={(e) => setHasAdminKey(e.target.checked)} 
                  />
                  <span>I have an administrative key</span>
                </label>
              </div>

              {hasAdminKey && (
                <div className="form-group admin-key-box">
                  <label><ShieldKeyhole size={14} /> Administrative Key</label>
                  <input 
                    type="password" 
                    placeholder="Enter admin secret key" 
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="auth-submit-btn">Register</button>

              <p className="auth-terms">
                By continuing you agree to our <strong>terms of service</strong>. Users can browse products without logging in, but an account is required for purchases or admin access.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}