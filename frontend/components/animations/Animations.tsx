import { ReactNode } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';

// Staggered animation for children
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animation for individual items in a list
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

// Fade in animation for sections
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 } 
  }
};

// Slide up animation for cards and panels
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

// Scale animation for buttons and interactive elements
export const scaleVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  },
  hover: { 
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  },
  tap: { 
    scale: 0.95 
  }
};

// Components with animations built-in
export const AnimatedContainer = ({ 
  children, 
  className = "", 
  delay = 0,
  ...props 
}: { 
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<HTMLMotionProps<"div">, "children" | "className">) => {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedItem = ({ 
  children, 
  className = "", 
  ...props 
}: { 
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children" | "className">) => {
  return (
    <motion.div
      className={className}
      variants={itemVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedCard = ({ 
  children, 
  className = "", 
  delay = 0,
  ...props 
}: { 
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<HTMLMotionProps<"div">, "children" | "className">) => {
  return (
    <motion.div
      className={className}
      variants={slideUpVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedButton = ({ 
  children, 
  className = "", 
  ...props 
}: { 
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"button">, "children" | "className">) => {
  return (
    <motion.button
      className={className}
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.button>
  );
};
