'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export default function StaggerItem({
  children,
  className = '',
  ...rest
}: StaggerItemProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  } as const;

  return (
    <motion.div
      variants={itemVariants}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
