'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DEANSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function DEANSidebar({ isCollapsed = false, onToggleCollapse }: DEANSidebarProps) {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const pathname = usePathname();
  
  // Use prop value if provided, otherwise use local state
  const collapsed = onToggleCollapse ? isCollapsed : localCollapsed;
  
  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed(!localCollapsed);
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dean-dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
        </svg>
      )
    },
    {
      title: 'Branches',
      href: '/dean-dashboard/branches',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Users',
      href: '/dean-dashboard/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      title: 'Subjects',
      href: '/dean-dashboard/subjects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    // {
    //   title: 'Basic Reports',
    //   href: '/dean-dashboard/basic-reports',
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    //     </svg>
    //   )
    // },
    {
      title: 'Reports',
      href: '/dean-dashboard/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Analytics',
      href: '/dean-dashboard/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 fixed top-16 left-0 h-screen z-10 overflow-y-auto ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800">DEAN Panel</h2>
              <p className="text-sm text-gray-500">Institution Management</p>
            </div>
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="mt-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <span className={`${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.title}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="mt-8 px-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-full p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">DEAN Access</p>
                <p className="text-xs text-purple-700">Institution-wide control</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
