export function getDaysInYear(year: number): Date[] {
  const days: Date[] = []
  
  // Create dates in UTC to avoid timezone issues
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

  const current = new Date(start)
  while (current <= end) {
    // Create a new date object for each day to avoid reference issues
    const dayDate = new Date(Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate()
    ))
    days.push(dayDate)
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return days
}

export function getDateKey(date: Date): string {
  // Use UTC to avoid timezone issues
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDayOfWeek(date: Date): number {
  return date.getUTCDay() // 0 = Sunday, 6 = Saturday
}
