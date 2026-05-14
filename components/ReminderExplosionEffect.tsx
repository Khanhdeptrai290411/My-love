'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Bell, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const isDateInRange = (currentDate: Date, startDateStr: string, endDateStr: string) => {
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  
  const startD = new Date(startDateStr)
  const endD = new Date(endDateStr)
  
  const start = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate())
  const end = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate())
  
  return today.getTime() >= start.getTime() && today.getTime() <= end.getTime()
}

export default function ReminderExplosionEffect() {
  const { data: session } = useSession()
  const { data } = useSWR(session ? '/api/reminders' : null, fetcher)
  
  const [showExplosion, setShowExplosion] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const hasInitialized = useRef(false)
  
  const activeReminders = useMemo(() => {
    if (!data?.reminders) return []
    const now = new Date()
    return data.reminders.filter((r: any) => {
      if (!r.isActive) return false
      return isDateInRange(now, r.startDate, r.endDate)
    })
  }, [data?.reminders])

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  useEffect(() => {
    if (!data?.reminders || hasInitialized.current) return
    
    hasInitialized.current = true
    if (activeReminders.length > 0) {
      setShowExplosion(true)
      setShowPopup(true)
      setTimeout(() => setShowExplosion(false), 4500)
    }
  }, [data, activeReminders.length])

  useEffect(() => {
    // Load saved position
    const savedPos = localStorage.getItem('reminder_bell_pos')
    if (savedPos) {
      try {
        const { x, y } = JSON.parse(savedPos)
        // Basic boundary check on load
        const safeX = Math.min(Math.max(x, 0), typeof window !== 'undefined' ? window.innerWidth - 64 : 0)
        const safeY = Math.min(Math.max(y, 0), typeof window !== 'undefined' ? window.innerHeight - 64 : 0)
        setPosition({ x: safeX, y: safeY })
      } catch (e) {}
    } else if (typeof window !== 'undefined') {
      // Default to bottom right
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 100 })
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (!bellRef.current) return
    setIsDragging(true)
    hasMoved.current = false
    
    const rect = bellRef.current.getBoundingClientRect()
    dragStartPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    // Capture pointer to track outside the element
    bellRef.current.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !bellRef.current) return
    hasMoved.current = true
    
    const newX = e.clientX - dragStartPos.current.x
    const newY = e.clientY - dragStartPos.current.y
    
    // Boundary check
    const maxX = window.innerWidth - 64
    const maxY = window.innerHeight - 64
    const safeX = Math.min(Math.max(newX, 0), maxX)
    const safeY = Math.min(Math.max(newY, 0), maxY)
    
    setPosition({ x: safeX, y: safeY })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !bellRef.current) return
    setIsDragging(false)
    bellRef.current.releasePointerCapture(e.pointerId)
    localStorage.setItem('reminder_bell_pos', JSON.stringify(position))
    
    if (!hasMoved.current) {
      // It was a click
      setShowPopup(true)
      if (activeReminders.length > 0) {
        setShowExplosion(true)
        setTimeout(() => setShowExplosion(false), 4500)
      }
    }
  }

  // Emojis for explosion (using the first active reminder's icon)
  const explosionIcon = activeReminders.length > 0 ? activeReminders[0].icon : '✨'
  const emojis = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    scale: 0.5 + Math.random() * 1.5,
    horizontalMovement: (Math.random() - 0.5) * 50
  }))

  return (
    <>
      {/* Draggable Bell */}
      <div
        ref={bellRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="fixed z-50 rounded-full bg-gradient-to-tr from-primary to-accent shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center text-white cursor-grab active:cursor-grabbing touch-none"
        style={{
          width: '60px',
          height: '60px',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease',
        }}
      >
        <Bell size={28} className={activeReminders.length > 0 ? "animate-pulse" : ""} />
        {activeReminders.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-bounce">
            {activeReminders.length}
          </span>
        )}
      </div>

      {/* Explosion Effect */}
      {showExplosion && activeReminders.length > 0 && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
          <style jsx>{`
            @keyframes float-up {
              0% { transform: translateY(100vh) translateX(0) scale(0.5); opacity: 0; }
              10% { opacity: 1; }
              80% { opacity: 0.8; }
              100% { transform: translateY(-20vh) translateX(var(--move-x)) scale(var(--scale)); opacity: 0; }
            }
            .emoji-particle {
              position: absolute;
              bottom: 0;
              font-size: 2rem;
              animation: float-up var(--duration) ease-out forwards;
              animation-delay: var(--delay);
              opacity: 0;
            }
          `}</style>
          {emojis.map((item) => (
            <div
              key={item.id}
              className="emoji-particle"
              style={{
                left: `${item.left}vw`,
                '--delay': `${item.delay}s`,
                '--duration': `${item.duration}s`,
                '--scale': item.scale,
                '--move-x': `${item.horizontalMovement}vw`,
              } as React.CSSProperties}
            >
              {explosionIcon}
            </div>
          ))}
        </div>
      )}

      {/* Reminder Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative bg-card/90 backdrop-blur-xl border border-border p-6 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground bg-secondary hover:bg-secondary/80 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-6 flex items-center gap-2">
              <Bell className="text-primary" /> Lời nhắc
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {activeReminders.length > 0 ? (
                activeReminders.map((r: any) => (
                  <div key={r._id} className="bg-secondary/40 p-4 rounded-2xl border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">
                      {r.icon}
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{r.icon}</span>
                        <h3 className="font-bold text-lg text-foreground">{r.title}</h3>
                      </div>
                      <p className="text-foreground/80 italic mb-3">&quot;{r.content}&quot;</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/80 bg-primary/10 w-fit px-2 py-1 rounded-md">
                        <Calendar size={14} /> 
                        {format(new Date(r.startDate), 'dd/MM HH:mm')} - {format(new Date(r.endDate), 'dd/MM HH:mm')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4 opacity-50">📭</div>
                  <p className="text-foreground/60 font-medium">Hiện tại chưa có lời nhắc nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
