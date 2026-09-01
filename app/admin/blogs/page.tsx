'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminBlogsPanel from '../components/AdminBlogsPanel';

export default function AdminBlogsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'ADMIN') {
            setIsAuthorized(true);
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (err) {
        router.push('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setIsLoggingOut(false);
      window.location.href = '/';
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-[#A855F7] shadow-lg shadow-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="group flex items-center -ml-4 md:-ml-8 transition-transform hover:scale-105">
                <Image
                  src="/logo_main.png"
                  alt="Step & Styl"
                  width={140}
                  height={45}
                  className="h-10 md:h-18 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <h1 className="text-2xl font-black uppercase tracking-wide text-white/90 -ml-10">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/?preview=true"
                className="text-white/80 hover:text-white font-medium transition-colors"
              >
                ← Back to Store
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-lg border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBlogsPanel />
      </div>
    </div>
  );
}
