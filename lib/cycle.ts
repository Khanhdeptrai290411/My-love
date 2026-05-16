export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal' | 'prePeriod' | 'latePeriod'

export interface CycleSettings {
  lastPeriodStart: string
  periodLength: number
  cycleLength: number
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function differenceInDays(dateA: Date, dateB: Date): number {
  const utc1 = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())
  const utc2 = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate())
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24))
}

export function getNextPeriodDate(settings: CycleSettings): Date {
  const start = parseLocalDate(settings.lastPeriodStart)
  return addDays(start, settings.cycleLength)
}

export function getOvulationDate(settings: CycleSettings): Date {
  const next = getNextPeriodDate(settings)
  return addDays(next, -14)
}

export function getCycleDayInfo(selectedDate: Date | string, settings: CycleSettings) {
  const date = typeof selectedDate === 'string' ? parseLocalDate(selectedDate) : selectedDate
  const start = parseLocalDate(settings.lastPeriodStart)
  
  let diff = differenceInDays(date, start)
  let isExtrapolatedBackwards = false

  // Handle past dates by extrapolating backwards
  if (diff < 0) {
    diff = (diff % settings.cycleLength + settings.cycleLength) % settings.cycleLength
    isExtrapolatedBackwards = true
  }

  const cycleDayNum = diff + 1
  let phase: CyclePhase

  if (!isExtrapolatedBackwards && diff >= settings.cycleLength) {
    phase = 'latePeriod'
  } else if (diff < settings.periodLength) {
    phase = 'period'
  } else if (diff >= settings.cycleLength - 5) {
    phase = 'prePeriod'
  } else if (diff === settings.cycleLength - 14 || diff === settings.cycleLength - 15 || diff === settings.cycleLength - 13) {
    phase = 'ovulation' // Make it a 3 day window for visual representation
  } else if (diff < settings.cycleLength - 14) {
    phase = 'follicular'
  } else {
    phase = 'luteal'
  }

  return {
    phase,
    cycleDayNum: !isExtrapolatedBackwards && diff >= settings.cycleLength ? cycleDayNum : (diff % settings.cycleLength) + 1,
    isLate: !isExtrapolatedBackwards && diff >= settings.cycleLength,
    daysLate: !isExtrapolatedBackwards && diff >= settings.cycleLength ? diff - settings.cycleLength + 1 : 0
  }
}

export function getCycleForecast(phase: CyclePhase) {
  switch (phase) {
    case 'period':
      return {
        title: "MƯA RÀO",
        icon: "🩸",
        loveTemp: "16°C tình cảm",
        status: "Cần chăm sóc",
        advice: "Hôm nay hãy nhẹ nhàng hơn. Có thể chuẩn bị nước ấm, đồ ăn dễ chịu và để cô ấy nghỉ ngơi.",
        explanation: "Kinh nguyệt là giai đoạn cơ thể đào thải niêm mạc tử cung. Cô ấy có thể mệt, đau bụng hoặc nhạy cảm hơn."
      }
    case 'prePeriod':
      return {
        title: "MÂY ĐEN NHẸ",
        icon: "☁️",
        loveTemp: "18°C cảm xúc",
        status: "Dễ nhạy cảm",
        advice: "Hôm nay nên dịu dàng hơn bình thường. Đừng trêu quá đà hoặc tranh luận căng thẳng.",
        explanation: "Trước kỳ kinh, cảm xúc có thể dao động hơn do thay đổi nội tiết."
      }
    case 'ovulation':
      return {
        title: "NẮNG ẤM",
        icon: "💜",
        loveTemp: "29°C yêu thương",
        status: "Năng lượng tốt",
        advice: "Hôm nay có thể là ngày năng lượng tốt hơn. Có thể rủ cô ấy đi chơi nhẹ hoặc tạo một kỷ niệm vui.",
        explanation: "Rụng trứng thường xảy ra khoảng giữa chu kỳ, nhưng có thể thay đổi tùy người."
      }
    case 'follicular':
      return {
        title: "TRỜI TRONG",
        icon: "🌿",
        loveTemp: "26°C dễ chịu",
        status: "Ổn định",
        advice: "Một ngày khá dễ chịu. Một tin nhắn quan tâm nhỏ vẫn luôn là điểm cộng.",
        explanation: "Giai đoạn nang trứng thường là lúc cơ thể hồi phục dần sau kỳ kinh."
      }
    case 'luteal':
      return {
        title: "GIÓ NHẸ",
        icon: "🌙",
        loveTemp: "23°C cảm xúc",
        status: "Cần để ý",
        advice: "Hãy quan sát cảm xúc của cô ấy nhiều hơn. Một hành động chăm sóc nhỏ sẽ rất có ích.",
        explanation: "Giai đoạn hoàng thể là sau rụng trứng và trước kỳ kinh tiếp theo."
      }
    case 'latePeriod':
      return {
        title: "SƯƠNG MÙ",
        icon: "⚪",
        loveTemp: "20°C cần chú ý",
        status: "Nên theo dõi",
        advice: "Nếu trễ nhiều ngày hoặc có dấu hiệu bất thường, nên khuyên cô ấy theo dõi thêm hoặc hỏi ý kiến chuyên môn.",
        explanation: "Chu kỳ có thể lệch do stress, sức khỏe, sinh hoạt hoặc nhiều yếu tố khác."
      }
  }
}

// Simple hash for consistent randomness
const getHashIndex = (dateStr: string, phase: string, max: number): number => {
  let hash = 0
  const str = `${dateStr}-${phase}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % max
}

export function getCycleDailyMessage(phase: CyclePhase, date: string): string {
  let list: string[] = []

  switch (phase) {
    case 'period':
      list = [
        "Hôm nay em cứ nghỉ ngơi đi, còn lại để anh lo.",
        "Nếu mệt quá thì nhớ nằm nghỉ nhé, anh thương.",
        "Anh có mua đồ ăn ngon cho em nè, chiều về anh ghé đưa nha.",
        "Uống nhiều nước ấm vào nhé tình yêu của anh.",
        "Hôm nay em là công chúa, mọi việc cứ để anh."
      ]
      break
    case 'prePeriod':
      list = [
        "Nếu hôm nay em thấy khó chịu hơn bình thường cũng không sao, anh vẫn ở đây với em.",
        "Đừng tự tạo áp lực cho mình nhé, anh luôn ủng hộ em.",
        "Em có muốn tâm sự gì không? Anh luôn sẵn sàng lắng nghe.",
        "Anh thương em nhất trên đời, nhớ nhé!",
        "Nếu thấy mệt thì nói anh nghe nha, đừng cố quá."
      ]
      break
    case 'ovulation':
      list = [
        "Hôm nay trông em có vẻ nhiều năng lượng hơn đó, mình làm gì vui vui không?",
        "Em có muốn đi ăn món gì ngon ngon tối nay không?",
        "Anh rất thích nụ cười của em ngày hôm nay.",
        "Cuối tuần này mình đi dạo đâu đó nhé?",
        "Em luôn xinh đẹp nhất trong mắt anh."
      ]
      break
    case 'follicular':
      list = [
        "Một ngày nhẹ nhàng thôi, nhưng anh vẫn muốn nhắc là anh thương em.",
        "Anh vừa nghĩ đến em nè.",
        "Ngày hôm nay của em thế nào? Kể anh nghe nhé.",
        "Nhớ uống đủ nước và ăn đúng bữa nha em.",
        "Anh luôn tự hào về những gì em đang làm."
      ]
      break
    case 'luteal':
      list = [
        "Hôm nay anh sẽ dịu dàng hơn một chút, vì em xứng đáng được vậy.",
        "Mọi chuyện vẫn ổn chứ em? Anh luôn ở đây.",
        "Anh nhớ em nhiều lắm.",
        "Nếu có chuyện gì không vui, nhớ nói với anh nhé.",
        "Anh luôn trân trọng từng khoảnh khắc bên em."
      ]
      break
    case 'latePeriod':
      list = [
        "Em cứ bình tĩnh theo dõi nha, có gì mình cùng xử lý, không để em lo một mình đâu.",
        "Sức khoẻ của em là quan trọng nhất, đừng lo nghĩ nhiều nhé.",
        "Anh luôn ở cạnh em, dù có chuyện gì xảy ra.",
        "Hãy ăn uống đủ chất và nghỉ ngơi nhiều hơn nhé.",
        "Anh thương em nhiều lắm."
      ]
      break
  }

  const index = getHashIndex(date, phase, list.length)
  return list[index]
}
