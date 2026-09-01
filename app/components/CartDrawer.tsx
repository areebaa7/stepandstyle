'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import type { AuthUser } from './AccountModal';
import { formatPKR } from '@/lib/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: AuthUser['role'] | null;
}

export default function CartDrawer({ isOpen, onClose, currentUserRole }: CartDrawerProps) {
  const { items, subtotal, totalCount, removeItem, updateQuantity, promoCode, applyPromoCode, clearCart } =
    useCart();
  const [promoInput, setPromoInput] = useState(promoCode);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isAdmin = currentUserRole === 'ADMIN';

  useEffect(() => {
    setPromoInput(promoCode);
  }, [promoCode]);

  useEffect(() => {
    if (!statusMessage) return;
    const timeout = setTimeout(() => setStatusMessage(null), 2500);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  const handleApplyPromo = () => {
    applyPromoCode(promoInput.trim());
    setStatusMessage(
      promoInput.trim()
        ? `Promo code "${promoInput.trim().toUpperCase()}" saved`
        : 'Promo code cleared',
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity duration-500" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.3)] z-[101] flex flex-col transform transition-transform duration-500 ease-out border-l border-gray-100">
        
        {/* Premium Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-6 sm:py-8 border-b border-gray-50">
          <div>
            <p className="text-xs font-semibold  tracking-wide text-purple-600 mb-1">Your shopping bag</p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900  tracking-tight">Items ({totalCount})</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-gray-100 text-gray-400 hover:text-purple-600 hover:border-purple-200 flex items-center justify-center transition-all group"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Item List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 no-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <p className="text-xl font-semibold text-gray-900  tracking-tight mb-2">Empty bag</p>
              <p className="text-sm text-gray-400 font-medium mb-8">Start adding items to see them here.</p>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-purple-600 text-white text-xs font-semibold  tracking-wide rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-6 pb-6 border-b border-gray-50 last:border-0 group">
                  <div className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="96px" className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[13px] font-semibold text-gray-900  tracking-tight line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <p className="text-[13px] font-bold text-gray-900">{formatPKR(item.price)}</p>
                      
                      {(item.size || item.color) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.size && (
                            <span className="text-xs font-semibold  tracking-wide text-gray-400 border border-gray-100 px-2 py-1 rounded">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs font-semibold  tracking-wide text-gray-400 border border-gray-100 px-2 py-1 rounded">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50/50">
                      <div className="flex items-center bg-gray-50 rounded-full px-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-colors font-bold"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-gray-900">{item.quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-purple-600 transition-colors font-bold"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        {formatPKR(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary Section */}
        {items.length > 0 && (
          <div className="px-8 py-5 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="space-y-4">
              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400  tracking-wide">Subtotal</span>
                  <span className="text-base font-semibold text-gray-900 tracking-tight">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400  tracking-wide">Shipping</span>
                  <span className="text-xs font-semibold text-green-600  tracking-wide">Calculated at next step</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                {isAdmin ? (
                  <div className="w-full bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold  tracking-wide text-center">
                    Admins manage orders from dashboard
                  </div>
                ) : (
                  <Link
                    href="/checkout"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-full text-xs font-semibold  tracking-wide text-center shadow-lg shadow-purple-100 hover:scale-[1.01] active:scale-95 transition-all"
                    onClick={onClose}
                  >
                    Proceed to Checkout
                  </Link>
                )}
                <button
                  className="w-full py-1 text-xs font-bold  tracking-wide text-gray-500 hover:text-red-500 transition-colors"
                  onClick={clearCart}
                  disabled={items.length === 0}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
