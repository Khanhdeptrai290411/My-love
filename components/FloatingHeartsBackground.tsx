'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface HeartProps {
  id: number
  size: number
  left: number
  delay: number
  duration: number
  swayAmount: number
}

export default function FloatingHeartsBackground() {
  const [hearts, setHearts] = useState<HeartProps[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate static random values once on mount to avoid hydration mismatch.
    const generatedHearts = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      size: Math.random() * 20 + 8, // 8px to 28px
      left: Math.random() * 100, // 0% to 100% horizontal position
      delay: Math.random() * 20, // Delay to stagger animations (faker duration)
      duration: Math.random() * 10 + 15, // 15s to 25s per cycle
      swayAmount: Math.random() * 40 - 20, // -20 to +20 sway distance
    }))
    setHearts(generatedHearts)
  }, [])

  useEffect(() => {
    // Calculate global mouse parallax offset based on container's coordinates
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Map mouse position to -1 to 1 based on the container size
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1
      setMousePos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    >
      {/* Dark mode overlay gradient: will apply a dark shade in dark mode, and slight pinkish transparent in light mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 dark:to-black/60 mix-blend-overlay -z-10 transition-colors duration-500" />
      
      {hearts.map((heart) => {
        // Parallax factor: larger hearts move MORE because they are "closer"
        const parallaxFactor = heart.size * 0.8
        const xOffset = mousePos.x * -parallaxFactor
        const yOffset = mousePos.y * -parallaxFactor

        return (
          <motion.div
            key={heart.id}
            // Pointer-events-auto allows hovering individual hearts. We use z-10 mostly so they sit above the overlay but behind main content (if content has higher z).
            className="absolute text-primary dark:text-red-500 opacity-40 dark:opacity-20 drop-shadow-sm pointer-events-auto cursor-default z-10"
            // Hover effect: scale up, increase opacity, and slightly offset based on cursor (parallax)
            whileHover={{ 
              scale: 1.5, 
              opacity: 0.9,
              transition: { duration: 0.2, type: "spring" } 
            }}
            initial={{ 
              y: '100%', // Start exactly at the bottom border
              x: 0, 
            }}
            animate={{ 
              // Animate upwards over a set duration. The absolute values represent 100vh of movement roughly.
              y: ['100%', '-800%'], 
              x: [0, heart.swayAmount, -heart.swayAmount, 0], // Gentle horizontal sway
              marginLeft: xOffset, // Parallax X
              marginTop: yOffset  // Parallax Y
            }}
            transition={{
              y: {
                duration: heart.duration,
                repeat: Infinity,
                ease: "linear",
                delay: -heart.delay, // Negative delay to start immediately at different progress points
              },
              x: {
                duration: heart.duration / 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              marginLeft: { type: "spring", stiffness: 100, damping: 30 },
              marginTop: { type: "spring", stiffness: 100, damping: 30 }
            }}
            style={{
              left: `${heart.left}%`,
              fontSize: heart.size,
              bottom: '-50px', // Ensures it starts out of view
            }}
          >
            ❤️
          </motion.div>
        )
      })}
    </div>
  )
}
