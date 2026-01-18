'use client'

import { calculateDaysInLove } from '@/lib/utils'
import Image from 'next/image'

interface LoveCounterProps {
  startDate: string
  member1Name?: string
  member2Name?: string
  member1Image?: string
  member2Image?: string
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
    <div className="relative flex flex-col items-center justify-center py-16 px-6 min-h-[500px]">
      {/* Title */}
      <h2 className="text-white text-2xl font-light mb-8 tracking-wide">Been Love Memory</h2>
      
      {/* Main Circle */}
      <div className="relative mb-12">
        {/* Outer circle border */}
        <div className="absolute inset-0 w-64 h-64 rounded-full border-8 border-pink-400 mx-auto"></div>
        
        {/* Content inside circle */}
        <div className="relative w-64 h-64 flex flex-col items-center justify-center">
          <p className="text-white text-xl font-light mb-4 tracking-wide">Đang yêu</p>
          <div className="text-white text-8xl font-bold mb-4">{days}</div>
          <p className="text-white text-xl font-light tracking-wide">Ngày</p>
          
          {/* Bottom line */}
          <div className="absolute bottom-0 w-48 h-1 bg-pink-400 rounded-full"></div>
        </div>
      </div>

      {/* Members */}
      {(member1Name || member2Name) && (
        <div className="relative z-10 flex items-end justify-center gap-6">
          {/* Member 1 */}
          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden mb-3">
              {member1Image ? (
                <Image
                  src={member1Image}
                  alt={member1Name || 'Member 1'}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {member1Name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-white text-sm font-light tracking-wide">
              {member1Name || 'Tên hiển thị 1'}
            </p>
          </div>
          
          {/* Heart icon */}
          <div className="text-pink-400 text-4xl mb-4">❤️</div>
          
          {/* Member 2 */}
          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden mb-3">
              {member2Image ? (
                <Image
                  src={member2Image}
                  alt={member2Name || 'Member 2'}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {member2Name?.charAt(0).toUpperCase() || 'B'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-white text-sm font-light tracking-wide">
              {member2Name || 'Tên hiển thị 2'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

