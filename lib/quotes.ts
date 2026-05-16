export function getQuoteIndex(date: string, coupleId: string, max: number): number {
  const hash = (date + coupleId).split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)
  return Math.abs(hash) % max
}

export function getFallbackQuote(date: string, coupleId: string, partnerGender: string = 'unknown'): string {
  const isFemale = partnerGender === 'female'
  const isMale = partnerGender === 'male'

  let list: string[] = []

  if (isFemale) {
    list = [
      "Hôm nay em có muốn chia sẻ điều gì với anh không?",
      "Mỗi ngày bên em đều là một ngày đẹp trời.",
      "Anh muốn biết hôm nay em đã làm gì.",
      "Em có nhớ anh không?",
      "Hôm nay em cảm thấy thế nào?",
      "Anh yêu em nhiều hơn mỗi ngày.",
      "Em là điều tuyệt vời nhất trong cuộc đời anh.",
      "Mỗi khoảnh khắc bên em đều đáng nhớ.",
      "Em làm cuộc sống của anh trở nên ý nghĩa.",
      "Anh luôn ở đây để lắng nghe em.",
      "Anh yêu cách em làm mọi thứ trở nên đặc biệt.",
      "Em là người quan trọng nhất với anh.",
      "Anh muốn nghe mọi điều về ngày của em."
    ]
  } else if (isMale) {
    list = [
      "Hôm nay anh làm việc có mệt không?",
      "Mỗi ngày có anh bên cạnh đều rất yên bình.",
      "Em luôn ở đây để chia sẻ mọi áp lực cùng anh.",
      "Hôm nay anh cảm thấy thế nào?",
      "Anh là chỗ dựa vững chắc nhất của em.",
      "Cảm ơn anh vì đã luôn cố gắng cho chúng ta.",
      "Hôm nay anh có điều gì muốn kể em nghe không?",
      "Em rất tự hào về anh.",
      "Anh hãy nhớ nghỉ ngơi nhé, đừng quá sức.",
      "Em luôn ủng hộ mọi quyết định của anh.",
      "Mỗi khoảnh khắc bên anh đều rất đáng trân trọng.",
      "Anh là người đàn ông tuyệt vời nhất của em.",
      "Dù có chuyện gì, em vẫn sẽ luôn ở bên anh."
    ]
  } else {
    list = [
      "Hôm nay bạn có muốn chia sẻ điều gì không?",
      "Mỗi ngày bên nhau đều là một ngày đặc biệt.",
      "Mình muốn biết hôm nay của bạn thế nào.",
      "Bạn có nhớ mình không?",
      "Hôm nay bạn cảm thấy thế nào?",
      "Tình yêu của chúng ta lớn lên mỗi ngày.",
      "Bạn là điều tuyệt vời nhất trong cuộc đời mình.",
      "Mỗi khoảnh khắc bên bạn đều đáng nhớ.",
      "Bạn làm cuộc sống của mình trở nên ý nghĩa.",
      "Mình luôn ở đây để lắng nghe bạn.",
      "Tình yêu mình dành cho bạn là mãi mãi.",
      "Bạn là người quan trọng nhất với mình.",
      "Hôm nay bạn đã làm gì vui?"
    ]
  }

  const index = getQuoteIndex(date, coupleId, list.length)
  return list[index]
}

export function getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
