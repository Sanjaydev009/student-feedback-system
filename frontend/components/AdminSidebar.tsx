'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AdminSidebarProps {
  isOpen?: boolean;
  currentPath?: string;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = true, currentPath = '', onClose }: AdminSidebarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  const menuCategories = [
    {
      title: "Dashboard",
      items: [
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
          label: 'Dashboard',
          href: '/admin-dashboard',
          badge: ''
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          ),
          label: 'Subjects',
          href: '/admin-dashboard/subjects',
          badge: ''
        },
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          ),
          label: 'User Management',
          href: '/admin-dashboard/users',
          badge: ''
        },
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          label: 'Bulk Upload',
          href: '/admin-dashboard/users/bulk-upload',
          badge: 'New'
        }
      ]
    },
    {
      title: "Analytics",
      items: [
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          ),
          label: 'Reports',
          href: '/admin-dashboard/reports',
          badge: ''
        },
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ),
          label: 'Analytics',
          href: '/admin-dashboard/analytics',
          badge: 'Advanced'
        }
      ]
    },
    {
      title: "System",
      items: [
        {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Settings',
          href: '/admin-dashboard/settings',
          badge: ''
        }
      ]
    }
  ];

  // Combined class for sidebar with responsive behavior
  const sidebarClassesStatic = `
    fixed left-0 top-24 w-72 h-[calc(100vh-6rem)] 
    bg-gradient-to-b from-gray-900 to-gray-800 
    text-white shadow-xl z-40
    overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800
    transition-all duration-300 ease-in-out
  `;

  // Determine visibility class based on mounted state
  const visibilityClass = mounted 
    ? (isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
    : '-translate-x-full lg:translate-x-0';
  
  const sidebarClasses = `${sidebarClassesStatic} ${visibilityClass}`;
  
  // If not mounted yet, return a minimal placeholder structure for SSR
  if (!mounted) {
    return (
      <div className={sidebarClassesStatic}>
        <div className="p-5 border-b border-gray-700/50"></div>
        <div className="mt-4 px-3"></div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Sidebar header */}
        <div className="p-5 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.168 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Admin Portal</h2>
              <p className="text-xs text-blue-300">Student Feedback System</p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="mt-4 px-3">
          {menuCategories.map((category, idx) => (
            <div key={`cat-${idx}`} className="mb-6">
              <div className="px-4 py-2">
                <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">{category.title}</p>
              </div>
              <ul className="mt-2 space-y-1">
                {category.items.map((item) => {
                  const isActive = currentPath === item.href;
                  return (
                    <motion.li 
                      key={item.href}
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Link 
                        href={item.href} 
                        onClick={onClose ? () => onClose() : undefined}
                        className={`
                          flex items-center justify-between py-3 px-4 rounded-lg
                          transition-all duration-200 ease-in-out
                          ${isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-800/50'
                            : 'text-gray-300 hover:bg-gray-700/40 hover:text-blue-200'}
                        `}
                      >
                        <div className="flex items-center">
                          <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-blue-500 text-xs px-2 py-1 rounded-full text-white font-medium">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          ))}
          
          {/* Account section */}
          <div className="px-4 py-2 mt-6">
            <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Account</p>
          </div>
          <ul className="mt-2 space-y-1">
            <motion.li
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <button 
                onClick={handleLogout} 
                className="flex items-center w-full py-3 px-4 rounded-lg text-gray-300 hover:bg-gray-700/40 hover:text-red-200 transition-colors"
              >
                <span className="mr-3 text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10 8a1 1 0 01-1 1H7a1 1 0 110-2h5a1 1 0 011 1zm-8-3a1 1 0 100-2 1 1 0 000 2zm0 6a1 1 0 100-2 1 1 0 000 2zm0-3a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Logout</span>
              </button>
            </motion.li>
          </ul>
          
          {/* System status */}
          <div className="mt-auto pt-8 pb-4 px-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">System Status</span>
                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              </div>
              <div className="text-xs text-gray-500">
                Version 1.0.0 • Online
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}