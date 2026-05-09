'use client'

import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HeartLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background z-50">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background empty heart */}
        <Heart className="absolute inset-0 w-full h-full text-primary/20" strokeWidth={1.5} />
        
        {/* Foreground filled heart that animates clipping from bottom to top */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)', 'inset(0% 0 0 0)'] }}
          transition={{ 
            duration: 1.5,
            times: [0, 0.7, 1], // Stays full for a bit before restarting
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Heart className="w-full h-full text-primary fill-primary drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" strokeWidth={1.5} />
        </motion.div>
      </div>
      <p className="mt-6 text-primary font-bold tracking-[0.2em] animate-pulse uppercase text-sm drop-shadow-sm">
        Đang chờ phép màu
      </p>
    </div>
  )
}
