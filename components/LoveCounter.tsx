'use client'

import { calculateDaysInLove } from '@/lib/utils'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import FloatingHeartsBackground from './FloatingHeartsBackground'

interface LoveCounterProps {
  startDate: string
  member1Name?: string
  member2Name?: string
  member1Image?: string
  member2Image?: string
}

// Component to handle number count up animation smoothly
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    const duration = 2000 // 2 seconds animation duration
    let animationFrameId: number
    
    const animate = (time: number) => {
      if (!startTime) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      
      // Easing function outQuart for a smooth stop
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      
      setDisplayValue(Math.floor(value * easeProgress))
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }
    
    animationFrameId = requestAnimationFrame(animate)
    
    return () => cancelAnimationFrame(animationFrameId)
  }, [value])

  return <>{displayValue}</>
}

export default function LoveCounter({ 
  startDate, 
  member1Name, 
  member2Name,
  member1Image,
  member2Image 
}: LoveCounterProps) {
  const days = calculateDaysInLove(startDate)

  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-6 min-h-[500px] z-0 overflow-hidden rounded-2xl">
      {/* Dynamic Background with Floating Hearts */}
      <FloatingHeartsBackground />

      {/* Main Content ensures it sits on top of the background */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-foreground/80 text-2xl font-medium mb-10 tracking-wide drop-shadow-md"
        >
          Been Love Memory
        </motion.h2>
        
        {/* Main Circle */}
        <div className="relative mb-14 drop-shadow-2xl">
          {/* Animated Glow Border */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-64 h-64 rounded-full border-[6px] border-dashed border-primary/40 mx-auto"
          />
          <div className="absolute inset-2 w-60 h-60 rounded-full border-[4px] border-primary/20 mx-auto" />
          
          {/* Content inside circle */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="relative w-64 h-64 flex flex-col items-center justify-center rounded-full bg-background/50 backdrop-blur-md shadow-[0_0_40px_rgba(244,63,94,0.15)] border border-white/20 dark:border-white/5"
          >
            <p className="text-foreground/90 text-xl font-medium mb-2 tracking-widest uppercase text-xs">Đang yêu</p>
            <div className="text-primary text-7xl font-black mb-2 drop-shadow-sm tracking-tighter">
              <AnimatedNumber value={days} />
            </div>
            <p className="text-foreground/80 text-lg font-medium tracking-wide uppercase text-xs">Ngày</p>
            
            {/* Bottom pulsing decorative line */}
            <motion.div 
              animate={{ width: ["100px", "140px", "100px"], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-6 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
            />
          </motion.div>
        </div>

        {/* Members Profile */}
        {(member1Name || member2Name) && (
          <div className="relative flex items-end justify-center gap-6">
            {/* Member 1 Avatar */}
            <motion.div 
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-center flex flex-col items-center group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full bg-background border-4 border-background shadow-[0_8px_30px_rgb(244,63,94,0.2)] overflow-hidden mb-4 group-hover:shadow-[0_8px_40px_rgb(244,63,94,0.4)] transition-shadow">
                {member1Image ? (
                  <Image
                    src={member1Image}
                    alt={member1Name || 'Member 1'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {member1Name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-foreground font-bold tracking-wide text-sm bg-background/50 px-3 py-1 rounded-full backdrop-blur-md">
                {member1Name || 'Tên hiển thị 1'}
              </p>
            </motion.div>
            
            {/* Heart Beating Pulse Animation */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-primary text-5xl mb-8 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
            >
              ❤️
            </motion.div>
            
            {/* Member 2 Avatar */}
            <motion.div 
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-center flex flex-col items-center group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full bg-background border-4 border-background shadow-[0_8px_30px_rgb(244,63,94,0.2)] overflow-hidden mb-4 group-hover:shadow-[0_8px_40px_rgb(244,63,94,0.4)] transition-shadow">
                {member2Image ? (
                  <Image
                    src={member2Image}
                    alt={member2Name || 'Member 2'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {member2Name?.charAt(0).toUpperCase() || 'B'}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-foreground font-bold tracking-wide text-sm bg-background/50 px-3 py-1 rounded-full backdrop-blur-md">
                {member2Name || 'Tên hiển thị 2'}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
