'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, decodeToken } from '@/utils/auth';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const, 
      stiffness: 100
    }
  }
};  // Main component
export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const auth = isAuthenticated();
    setIsAuth(auth);
    
    if (auth) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = decodeToken(token);
          setUserRole(decoded.role);
        } catch (error) {
          console.error('Failed to decode token', error);
        }
      }
    }
    
    // Intersection Observer for sections
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-section'));
          if (!isNaN(index)) {
            setActiveSection(index);
          }
        }
      });
    }, { threshold: 0.5 });

    // Observe all sections
    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section);
    });
    
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      sectionsRef.current.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  // Redirect based on role
  const redirectToDashboard = () => {
    if (!isAuth) return;
    
    switch (userRole) {
      case 'admin':
        router.push('/admin-dashboard');
        break;
      case 'hod':
        router.push('/hod-dashboard');
        break;
      case 'student':
        router.push('/my-feedback');
        break;
      default:
        // For any other role, stay on home page
        break;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              className="flex items-center space-x-3" 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Student Feedback System
              </h1>
            </motion.div>
            
            <motion.nav 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isAuth ? (
                <div className="flex space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link 
                      href="/login"
                      onClick={() => localStorage.removeItem('token')}
                      className="px-5 py-2 block border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg shadow-sm"
                    >
                      Logout
                    </Link>
                  </motion.div>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link 
                      href="/login" 
                      className="px-5 py-2 block bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md"
                    >
                      Login
                    </Link>
                  </motion.div>
                </div>
              )}
            </motion.nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="container mx-auto px-6 pt-16 pb-32">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Hero content */}
            <motion.div 
              className="w-full lg:w-1/2 lg:pr-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
                <span className="block">Student Feedback</span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Made Simple</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                A comprehensive platform for collecting, analyzing, and acting on student feedback. 
                Empower your educational institution with data-driven insights.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {!isAuth && (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link 
                        href="/login" 
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md inline-block"
                      >
                        Login
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link 
                        href="#features" 
                        className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg inline-block"
                      >
                        Learn More
                      </Link>
                    </motion.div>
                  </>
                )}
                {isAuth && (
                  <div className="flex flex-wrap gap-4">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link 
                        href="#features" 
                        className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg inline-block"
                      >
                        Learn More
                      </Link>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Hero image */}
            <motion.div 
              className="w-full lg:w-1/2 mt-12 lg:mt-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-10 rounded-3xl transform rotate-3"></div>
                <img 
                  src="https://images.unsplash.com/photo-1606761568499-6d2451b23c66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fHN0dWRlbnRzJTIwZmVlZGJhY2t8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60"
                  alt="Students giving feedback" 
                  className="relative z-10 rounded-3xl shadow-xl"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.src = 'https://via.placeholder.com/800x533?text=Feedback+System';
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <section 
        className="bg-white py-20" 
        ref={(el) => { 
          if (el) sectionsRef.current[1] = el; 
          return; 
        }} 
        data-section={1} 
        id="features"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={activeSection >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to collect and analyze meaningful student feedback
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={activeSection >= 1 ? "visible" : "hidden"}
          >
            {/* Feature 1 */}
            <motion.div variants={itemVariants} className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple Feedback Collection</h3>
              <p className="text-gray-600">
                Intuitive interface for students to provide feedback on courses, instructors, and facilities.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div variants={itemVariants} className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">
                Comprehensive reports and analytics to identify trends, strengths, and areas for improvement.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div variants={itemVariants} className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Anonymous</h3>
              <p className="text-gray-600">
                Option for anonymous feedback to encourage honest responses in a secure environment.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section 
        className="bg-gray-50 py-20" 
        ref={(el) => { 
          if (el) sectionsRef.current[2] = el; 
          return; 
        }} 
        data-section={2}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={activeSection >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple process to gather valuable insights
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={activeSection >= 2 ? "visible" : "hidden"}
          >
            {/* Step 1 */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Feedback</h3>
              <p className="text-gray-600">
                Students provide feedback on subjects and instructors through an intuitive form.
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="w-16 h-16 bg-indigo-500 rounded-full text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyze Results</h3>
              <p className="text-gray-600">
                Administrators review feedback data through comprehensive reports and dashboards.
              </p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Implement Changes</h3>
              <p className="text-gray-600">
                Take informed actions to improve educational quality based on valuable feedback.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section 
        className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
        ref={(el) => { 
          if (el) sectionsRef.current[3] = el; 
          return; 
        }} 
        data-section={3}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={activeSection >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Improve Your Educational Institution?</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto">
              Join thousands of educational institutions using our platform to collect and analyze student feedback.
            </p>
            
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/login" className="px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Login Here
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Student Feedback System</h3>
            </div>
            
            <div className="flex space-x-8">
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Student Feedback System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}