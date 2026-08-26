import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const PageTransition: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
    >
      {children}
    </motion.div>
  );
};
