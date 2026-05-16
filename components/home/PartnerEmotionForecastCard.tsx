'use client'
import { useMemo } from 'react'
import { getPartnerEmotionForecast, MoodCheckIn } from '@/lib/forecast'

const moodLabels: Record<string, string> = {
  happy: 'Vui vẻ',
  sad: 'Buồn',
  calm: 'Bình yên',
  stressed: 'Căng thẳng',
  excited: 'Hào hứng',
  tired: 'Mệt mỏi',
  anxious: 'Lo lắng',
  grateful: 'Biết ơn',
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  calm: '😌',
  stressed: '😣',
  excited: '🤩',
  tired: '😴',
  anxious: '😰',
  grateful: '🙏',
}

export default function PartnerEmotionForecastCard({ moodData, onCheckInClick }: { moodData: any, onCheckInClick: () => void }) {
  const forecast = useMemo(() => {
    if (!moodData || !moodData.moods?.partner) return null
    return getPartnerEmotionForecast({ ...moodData.moods.partner } as MoodCheckIn, moodData.partnerGender)
  }, [moodData])

  const myMood = moodData?.moods?.me
  const partnerMood = moodData?.moods?.partner

  if (!partnerMood) {
    return (
      <div className="glass-card p-6 md:p-8 mb-8 text-center bg-gradient-to-br from-secondary/50 to-background border-2 border-primary/20">
        <h3 className="text-xl font-bold text-foreground mb-2">Đang chờ người ấy check-in mood</h3>
        <p className="text-foreground/70 mb-6">Khi người ấy chọn mood, app sẽ dự báo thời tiết cảm xúc để bạn chăm sóc tốt hơn.</p>
        
        {!myMood && (
          <button 
            onClick={onCheckInClick}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-all"
          >
            Check-in mood của bạn
          </button>
        )}

        {myMood && (
          <div className="mt-4 pt-4 border-t border-border inline-flex items-center gap-2 text-sm text-foreground/80 font-medium">
            <span>Bạn hôm nay:</span>
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              {moodEmojis[myMood.mood]} {moodLabels[myMood.mood]} (Mức {myMood.intensity})
            </span>
            <button 
              onClick={onCheckInClick}
              className="ml-2 text-primary hover:underline font-bold text-xs"
            >
              Sửa
            </button>
          </div>
        )}
      </div>
    )
  }

  // Determine colors based on tone
  const colorMap: Record<string, string> = {
    positive: 'from-pink-400 to-rose-500 text-pink-500 bg-pink-500/10',
    neutral: 'from-blue-400 to-indigo-500 text-blue-500 bg-blue-500/10',
    careful: 'from-amber-400 to-orange-500 text-amber-500 bg-amber-500/10',
    urgent: 'from-red-500 to-rose-600 text-red-500 bg-red-500/10'
  }
  
  // Need to extract the gradient for text/bar and the light bg separately
  const toneData = forecast ? colorMap[forecast.tone] : colorMap.neutral
  const gradientClass = toneData.split(' ').slice(0, 2).join(' ')
  const lightBgClass = toneData.split(' ').pop()

  return (
    <div className="glass-card p-6 md:p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none">
        {forecast?.weatherIcon}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-bold tracking-wider text-primary/80 uppercase bg-primary/10 px-3 py-1 rounded-full">
            DỰ BÁO HÔM NAY
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-5xl drop-shadow-md">{forecast?.weatherIcon}</span>
              <div>
                <h2 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${gradientClass}`}>
                  {forecast?.weatherTitle}
                </h2>
                <p className="text-lg font-bold text-foreground/80">{forecast?.loveTemp} • {forecast?.status}</p>
              </div>
            </div>
            
            <div className="mt-6 mb-2 flex justify-between text-sm font-bold text-foreground/70">
              <span>{forecast?.progressLabel}</span>
              <span>{forecast?.warningLevel}%</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-1000`} 
                style={{ width: `${forecast?.warningLevel}%` }}
              />
            </div>
            
            <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border mt-4">
              <p className="text-foreground/90 font-medium leading-relaxed">
                💡 {forecast?.advice}
              </p>
            </div>
            
            {myMood && (
              <div className={`mt-6 p-3 rounded-xl border border-border flex items-center justify-between ${lightBgClass}`}>
                <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                  <span className="opacity-70">Cảm xúc của bạn:</span>
                  <span className="flex items-center gap-1 font-bold">
                    {moodEmojis[myMood.mood]} {moodLabels[myMood.mood]}
                  </span>
                </div>
                <button 
                  onClick={onCheckInClick}
                  className="text-xs font-bold px-2 py-1 bg-background/50 rounded-lg hover:bg-background transition-colors"
                >
                  Sửa
                </button>
              </div>
            )}
            
            {!myMood && (
              <div className="mt-6">
                <button 
                  onClick={onCheckInClick}
                  className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                >
                  + Bạn cũng hãy check-in mood nhé
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
