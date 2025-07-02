'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
          console.log('No token or user found');
          return false;
        }
        
        // Check token validity by attempting to decode it
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decoded = JSON.parse(jsonPayload);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp && decoded.exp < currentTime) {
            console.log('Token expired');
            return false;
          }
          
          // Check role if required
          if (requiredRole) {
            const user = JSON.parse(userStr);
            if (user.role !== requiredRole) {
              console.log(`Role ${requiredRole} required, but user has role ${user.role}`);
              return false;
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error decoding token:', error);
          return false;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        return false;
      }
    };
    
    const isAuthenticated = checkAuth();
    setAuthorized(isAuthenticated);
    setLoading(false);
    
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [router, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
