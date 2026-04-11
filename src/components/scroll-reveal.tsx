"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        delay,
        duration,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
