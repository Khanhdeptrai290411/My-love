'use client'
import { useState, useEffect } from 'react'
import CycleSettingsForm from '@/components/cycle/CycleSettings'
import CycleCalendar from '@/components/cycle/CycleCalendar'
import CycleDayDetailCard from '@/components/cycle/CycleDayDetailCard'
import CycleDailyMessageCard from '@/components/cycle/CycleDailyMessageCard'
import ImportantCycleDates from '@/components/cycle/ImportantCycleDates'
import { CycleSettings } from '@/lib/cycle'
import Navbar from '@/components/Navbar'
import UpcomingEventBackground from '@/components/UpcomingEventBackground'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CyclePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Sử dụng SWR để tự động cập nhật dữ liệu (auto-revalidate)
  const { data, error, isLoading, mutate } = useSWR('/api/couple/me', fetcher, {
    refreshInterval: 10000, // Tự động lấy dữ liệu mới mỗi 10 giây (nếu có thay đổi)
    revalidateOnFocus: true // Tự động lấy dữ liệu khi người dùng quay lại tab/app
  })

  const settings: CycleSettings | null = data?.couple?.cycleSettings || null
  const loading = isLoading && !data

  const handleSaveSettings = (newSettings: CycleSettings) => {
    mutate({ ...data, couple: { ...data.couple, cycleSettings: newSettings } }, false)
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <UpcomingEventBackground />
      <Navbar />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        {/* Background Decor */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[80px]" />
        </div>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 lg:mb-12 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-sm mb-2">
            Lịch Chu Kỳ
          </h1>
          <p className="text-foreground/70 text-sm md:text-base font-medium">
            Theo dõi và chăm sóc người ấy tinh tế hơn qua từng ngày.
          </p>
        </div>
      </div>

      {!settings && (
        <CycleSettingsForm 
          initialSettings={settings} 
          onSave={handleSaveSettings} 
        />
      )}

      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          {/* Cột trái */}
          <div className="space-y-8">
            <CycleCalendar 
              settings={settings} 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
            />
            <CycleSettingsForm 
              initialSettings={settings} 
              onSave={handleSaveSettings} 
            />
          </div>
          
          {/* Cột phải */}
          <div className="space-y-8">
            <CycleDayDetailCard 
              selectedDate={selectedDate} 
              settings={settings} 
            />
            
            <ImportantCycleDates 
              settings={settings} 
            />

            <CycleDailyMessageCard 
              selectedDate={selectedDate} 
              settings={settings} 
            />
          </div>
        </div>
      )}

        <div className="text-center pb-6 mt-12 lg:mt-16">
          <p className="text-xs text-foreground/40 italic">
            * Dự báo chỉ mang tính chất tham khảo để chăm sóc và nhắc nhở, không thay thế tư vấn y tế.
          </p>
        </div>
      </div>
    </div>
  )
}
