// Fallback quotes - 50 câu tình cảm
export const fallbackQuotes = [
  "Hôm nay em có muốn chia sẻ điều gì với anh không?",
  "Mỗi ngày bên em đều là một ngày đẹp trời.",
  "Anh muốn biết hôm nay em đã làm gì.",
  "Em có nhớ anh không?",
  "Hôm nay em cảm thấy thế nào?",
  "Anh yêu em nhiều hơn mỗi ngày.",
  "Em là điều tuyệt vời nhất trong cuộc đời anh.",
  "Hôm nay em có điều gì muốn nói với anh không?",
  "Mỗi khoảnh khắc bên em đều đáng nhớ.",
  "Em làm cuộc sống của anh trở nên ý nghĩa.",
  "Hôm nay em có vui không?",
  "Anh luôn nghĩ về em.",
  "Em là nguồn cảm hứng của anh.",
  "Hôm nay em đã làm gì vui?",
  "Anh muốn nghe em kể về ngày của em.",
  "Em là điều tốt đẹp nhất trong ngày của anh.",
  "Hôm nay em có điều gì muốn chia sẻ không?",
  "Anh yêu cách em làm mọi thứ trở nên đặc biệt.",
  "Em có nhớ những khoảnh khắc đẹp của chúng ta không?",
  "Hôm nay em cảm thấy như thế nào?",
  "Anh muốn biết mọi điều về ngày của em.",
  "Em là lý do anh thức dậy mỗi sáng với nụ cười.",
  "Hôm nay em có muốn nói gì với anh không?",
  "Anh yêu cách em khiến mọi thứ trở nên dễ dàng.",
  "Em là ngôi sao sáng nhất trong cuộc đời anh.",
  "Hôm nay em đã làm gì?",
  "Anh luôn ở đây để lắng nghe em.",
  "Em làm trái tim anh đập nhanh hơn.",
  "Hôm nay em có điều gì muốn chia sẻ không?",
  "Anh yêu em vì tất cả những gì em là.",
  "Em là người quan trọng nhất với anh.",
  "Hôm nay em cảm thấy thế nào?",
  "Anh muốn biết em đang nghĩ gì.",
  "Em là điều tuyệt vời nhất đã xảy ra với anh.",
  "Hôm nay em có muốn nói gì không?",
  "Anh yêu cách em khiến mọi ngày trở nên đặc biệt.",
  "Em là người bạn đời hoàn hảo của anh.",
  "Hôm nay em đã làm gì vui?",
  "Anh luôn nghĩ về em và những khoảnh khắc đẹp.",
  "Em là nguồn hạnh phúc của anh.",
  "Hôm nay em có điều gì muốn chia sẻ không?",
  "Anh yêu em nhiều hơn em có thể tưởng tượng.",
  "Em làm cuộc sống của anh trở nên đầy màu sắc.",
  "Hôm nay em cảm thấy như thế nào?",
  "Anh muốn nghe mọi điều về ngày của em.",
  "Em là điều tốt đẹp nhất trong cuộc đời anh.",
  "Hôm nay em có muốn nói gì với anh không?",
  "Anh yêu cách em khiến mọi thứ trở nên đẹp đẽ.",
  "Em là người anh muốn dành cả đời bên cạnh.",
]

// Hash function để chọn quote ổn định theo date + coupleId
export function getQuoteIndex(date: string, coupleId: string): number {
  const hash = (date + coupleId).split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)
  return Math.abs(hash) % fallbackQuotes.length
}

export function getFallbackQuote(date: string, coupleId: string): string {
  const index = getQuoteIndex(date, coupleId)
  return fallbackQuotes[index]
}

export function getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

