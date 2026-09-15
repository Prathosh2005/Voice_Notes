import React from 'react';
import { motion } from 'framer-motion';

export default function DarkVeil() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
      {/* Subtle animated gradient background */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 0% 0%, rgba(30, 41, 59, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 100% 100%, rgba(30, 41, 59, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 0% 0%, rgba(30, 41, 59, 0.4) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-80"
      />
      
      {/* Noise overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
