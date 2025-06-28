'use client';

import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

const publicPaths = ['/login', '/register', '/update-password'];

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPath = publicPaths.includes(pathname);

  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`min-h-screen ${isPublicPath ? 'bg-gray-50' : 'bg-gray-100'}`}>
        <ToastProvider>
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}