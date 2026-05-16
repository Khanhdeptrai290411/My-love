export interface ActivityLog {
  date: string // YYYY-MM-DD
  userActive: boolean
  partnerActive: boolean
}

export const formatDateKey = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const isTodayCompleted = (activityLogs: ActivityLog[], currentDate: Date) => {
  const todayStr = formatDateKey(currentDate)
  const todayLog = activityLogs.find(log => log.date === todayStr)
  return todayLog ? todayLog.userActive && todayLog.partnerActive : false
}

export const calculateStreak = (activityLogs: ActivityLog[], currentDate: Date) => {
  // Sort logs by date descending
  const sortedLogs = [...activityLogs].sort((a, b) => b.date.localeCompare(a.date))
  
  let streak = 0
  const todayStr = formatDateKey(currentDate)
  
  // Create a map for quick lookup
  const logMap = new Map(sortedLogs.map(log => [log.date, log]))
  
  // Start from today or yesterday
  let checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  let checkDateStr = formatDateKey(checkDate)
  
  const todayLog = logMap.get(todayStr)
  
  // If today is completed, streak includes today
  if (todayLog && todayLog.userActive && todayLog.partnerActive) {
    streak++
  }
  
  // Go back day by day starting from yesterday
  checkDate.setDate(checkDate.getDate() - 1)
  
  while (true) {
    checkDateStr = formatDateKey(checkDate)
    const log = logMap.get(checkDateStr)
    
    if (log && log.userActive && log.partnerActive) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}
