'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface HODNavbarProps {
  onMenuClick?: () => void;
}

export default function HODNavbar({ onMenuClick }: HODNavbarProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md fixed top-0 left-0 right-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Menu button for mobile */}
          <button 
            onClick={onMenuClick}
            className="block lg:hidden rounded p-1 hover:bg-indigo-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold">HOD Dashboard</h1>
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="hidden md:block relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-indigo-600 bg-opacity-50 text-white placeholder-indigo-200 rounded-lg py-1 px-3 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40 w-40 lg:w-64"
            />
            <svg className="w-5 h-5 text-indigo-200 absolute right-2 top-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              className="p-1 rounded-full hover:bg-indigo-600 transition-colors relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 bg-red-500 rounded-full w-2 h-2"></span>
            </button>
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-1 rounded hover:bg-indigo-600 transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="font-medium text-sm">HD</span>
              </div>
              <div className="hidden md:block text-sm text-left">
                <div className="font-medium">HOD User</div>
                <div className="text-xs opacity-70">Department Head</div>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
              >
                <Link href="/hod-dashboard/profile" className="block px-4 py-2 text-gray-800 hover:bg-indigo-50">Profile</Link>
                <Link href="/update-password" className="block px-4 py-2 text-gray-800 hover:bg-indigo-50">Change Password</Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}