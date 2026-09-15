import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function SplashCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Outer blurred trailing aura */}
      <motion.div
        className="absolute w-12 h-12 rounded-full bg-primary-500/20 blur-md pointer-events-none mix-blend-screen"
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          mass: 0.5
        }}
      />
      {/* Inner sharp dot */}
      <motion.div
        className="absolute w-4 h-4 rounded-full bg-primary-400/60 pointer-events-none mix-blend-screen shadow-[0_0_15px_rgba(59,130,246,0.8)]"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.1
        }}
      />
    </div>
  );
}
