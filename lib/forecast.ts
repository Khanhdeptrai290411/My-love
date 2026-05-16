export type MoodType = 'happy' | 'sad' | 'calm' | 'stressed' | 'excited' | 'tired' | 'anxious' | 'grateful'

export interface MoodCheckIn {
  mood: MoodType
  moodLabel: string
  emoji: string
  intensity: number // 1 to 4
  note?: string
  date: string // YYYY-MM-DD
}

export interface ForecastResult {
  weatherTitle: string
  weatherIcon: string
  loveTemp: string
  status: string
  warningLevel: number
  progressLabel: string
  advice: string
  tone: "positive" | "neutral" | "careful" | "urgent"
}

// Simple hash function to get a deterministic index
const getHashIndex = (dateStr: string, mood: string, max: number): number => {
  let hash = 0
  const str = `${dateStr}-${mood}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash) % max
}

export const getPartnerPronouns = (gender: string) => {
  if (gender === 'female') {
    return { subject: 'cô ấy', object: 'cô ấy', possessive: 'cô ấy' }
  }
  if (gender === 'male') {
    return { subject: 'anh ấy', object: 'anh ấy', possessive: 'anh ấy' }
  }
  return { subject: 'người ấy', object: 'người ấy', possessive: 'người ấy' }
}

export const getPartnerEmotionForecast = (
  moodCheckIn: MoodCheckIn, 
  partnerGender: string = 'unknown',
  currentDate: string = new Date().toISOString().split('T')[0]
): ForecastResult => {
  const { mood, intensity } = moodCheckIn
  const p = getPartnerPronouns(partnerGender)

  // Advices tailored by gender and intensity
  const getAdvice = (moodType: string, level: 'low' | 'high') => {
    const isFemale = partnerGender === 'female'
    const isMale = partnerGender === 'male'
    
    // Default / Unknown / Other
    let list: string[] = []

    if (moodType === 'happy') {
      if (level === 'low') {
        if (isFemale) list = [
          `Hôm nay tâm trạng ${p.object} khá tốt. Có thể rủ đi ăn món yêu thích hoặc tạo thêm một kỷ niệm nhỏ.`,
          `Có vẻ ${p.subject} đang có một ngày nhẹ nhàng. Gửi một tin nhắn đáng yêu để nhân đôi niềm vui nhé.`,
          `Năng lượng tích cực đang toả ra từ ${p.object}. Một cái ôm nhẹ khi gặp mặt sẽ rất tuyệt đấy.`
        ]
        else if (isMale) list = [
          `Hôm nay ${p.subject} có vẻ đang thoải mái. Một lời khen nhỏ sẽ khiến ${p.object} vui cả ngày.`,
          `Tâm trạng ${p.object} đang khá ổn định. Thích hợp để cùng bàn về một kế hoạch đi chơi nhỏ.`,
          `Có vẻ mọi việc hôm nay suôn sẻ với ${p.subject}. Hãy chia sẻ niềm vui cùng ${p.object} nhé.`
        ]
        else list = [
          `Hôm nay tâm trạng ${p.object} khá tốt. Hãy tận dụng năng lượng này để có một buổi tối thật vui.`,
          `Tâm trạng ổn định. Rất thích hợp để hai bạn có những khoảnh khắc đáng yêu bên nhau.`,
          `Năng lượng của ${p.subject} đang khá cao, hãy lan toả sự vui vẻ đó.`
        ]
      } else { // high
        if (isFemale) list = [
          `Hôm nay ${p.subject} đang rất rạng rỡ. Hãy tận dụng để cùng làm điều gì đó thật dễ thương.`,
          `${p.subject} đang ngập tràn năng lượng hạnh phúc! Đừng quên lưu lại khoảnh khắc đẹp này nhé.`,
          `Niềm vui của ${p.object} đang ở mức cao. Hãy hoà nhịp và tạo ra kỷ niệm thật đặc biệt hôm nay.`
        ]
        else if (isMale) list = [
          `Hôm nay ${p.subject} đang có năng lượng rất tuyệt. Hãy cùng hưởng ứng nhiệt tình nhé!`,
          `Một ngày thành công hoặc rất vui của ${p.object}. Đừng ngại thể hiện sự ngưỡng mộ của bạn.`,
          `Năng lượng tích cực lên cao! Chắc chắn ${p.subject} sẽ rất thích nếu bạn cùng chia sẻ niềm vui này.`
        ]
        else list = [
          `Hôm nay ${p.subject} đang rất vui. Hãy tận dụng để cùng làm điều gì đó dễ thương.`,
          `Niềm vui đang lan toả! Một ngày tuyệt vời để ghi lại những kỷ niệm hạnh phúc.`,
          `Năng lượng tích cực tối đa. Cùng tạo ra một ngày thật trọn vẹn nhé.`
        ]
      }
    }

    else if (moodType === 'sad') {
      if (level === 'low') {
        if (isFemale) list = [
          `Hôm nay đừng hỏi quá dồn dập. Hãy ở cạnh, nói nhẹ nhàng và cho ${p.object} cảm giác được thương.`,
          `${p.subject} đang hơi trùng xuống một chút. Một ly nước ấm hoặc lời quan tâm chân thành sẽ làm ${p.object} an lòng.`,
          `Chỉ cần bạn kiên nhẫn lắng nghe, không cần phải khuyên bảo gì nhiều, ${p.object} sẽ thấy khá hơn.`
        ]
        else if (isMale) list = [
          `Hôm nay ${p.subject} có vẻ hơi xuống năng lượng. Bạn có thể nhẹ nhàng hỏi thăm xem ${p.object} có ổn không.`,
          `Đôi khi ${p.subject} chỉ cần một khoảng lặng và biết rằng bạn vẫn ủng hộ. Đừng gặng hỏi quá nhiều.`,
          `Một tin nhắn động viên ngắn gọn từ bạn sẽ tiếp thêm sức mạnh cho ${p.object} lúc này.`
        ]
        else list = [
          `Hôm nay đừng hỏi quá dồn dập. Hãy ở cạnh, nói nhẹ nhàng và cho ${p.object} cảm giác được thương.`,
          `Một chút quan tâm đúng lúc sẽ làm ${p.object} thấy an tâm hơn.`,
          `Đôi khi sự im lặng lắng nghe là liều thuốc tốt nhất cho ${p.object} lúc này.`
        ]
      } else { // high
        if (isFemale) list = [
          `Hôm nay hãy thật dịu dàng. Đừng tranh luận, đừng im lặng quá lâu. Một câu "anh ở đây mà" sẽ rất có ý nghĩa.`,
          `${p.subject} đang rất cần điểm tựa. Hãy ôm ${p.object} vào lòng và cho ${p.object} biết mọi thứ sẽ ổn.`,
          `Mức độ nhạy cảm đang rất cao. Tuyệt đối tránh cãi vã, hãy xoa dịu ${p.object} bằng sự ân cần tuyệt đối.`
        ]
        else if (isMale) list = [
          `${p.subject} đang trải qua cảm xúc khá tiêu cực. Hãy cho ${p.object} thấy bạn là bến đỗ bình yên nhất lúc này.`,
          `Đừng cố tìm cách giải quyết vấn đề thay ${p.object}. Hãy cứ nắm tay và nói "Có em ở đây rồi".`,
          `Áp lực tinh thần đang lớn. Sự dịu dàng và kiên nhẫn của bạn là điều ${p.object} cần nhất.`
        ]
        else list = [
          `Hôm nay hãy thật dịu dàng. Đừng tranh luận, đừng im lặng quá lâu. Hãy làm điểm tựa vững chắc cho ${p.object}.`,
          `${p.subject} đang rất buồn. Hãy cho ${p.object} thời gian và không gian an toàn để chia sẻ.`,
          `Hãy thể hiện sự cảm thông sâu sắc. Sự hiện diện của bạn lúc này quan trọng hơn ngàn lời khuyên.`
        ]
      }
    }

    else if (moodType === 'calm') {
      if (isFemale) list = [
        `Một ngày nhẹ nhàng. Chỉ cần một tin nhắn quan tâm đúng lúc là đủ làm ${p.object} thấy an toàn.`,
        `Mọi thứ đang yên bình. Bạn có thể kể một câu chuyện vui nhỏ để điểm xuyết thêm cho ngày của ${p.object}.`,
        `Bình yên là lúc tuyệt vời nhất để nuôi dưỡng tình cảm. Hãy gửi một lời chúc ngọt ngào.`
      ]
      else if (isMale) list = [
        `Tâm trạng ${p.object} đang cân bằng. Đôi khi sự bình yên này là khoảng nghỉ tuyệt vời nhất cho cả hai.`,
        `Mọi thứ bình ổn. Bạn có thể chia sẻ những câu chuyện hàng ngày để gắn kết thêm với ${p.subject}.`,
        `Duy trì sự thoải mái này bằng những tin nhắn nhỏ gọn, không gây áp lực.`
      ]
      else list = [
        `Một ngày nhẹ nhàng. Chỉ cần một tin nhắn quan tâm đúng lúc là đủ làm ${p.object} thấy an toàn.`,
        `Trạng thái cân bằng. Tuyệt vời để thực hiện các thói quen hàng ngày cùng nhau.`,
        `Sự bình yên hiện tại là nền tảng tốt để nuôi dưỡng tình cảm vững chắc.`
      ]
    }

    else if (moodType === 'stressed') {
      if (level === 'low') {
        if (isFemale) list = [
          `Hôm nay nên nói chuyện chậm lại. Hãy hỏi xem có việc gì bạn có thể làm giúp ${p.object} không.`,
          `${p.subject} đang có chút áp lực. Một món ăn ngon giao đến tận nơi có thể giải toả rất nhiều đấy.`,
          `Hãy nhận bớt một phần việc nếu có thể, hoặc đơn giản là massage nhẹ nhàng cho ${p.object}.`
        ]
        else if (isMale) list = [
          `Hôm nay ${p.subject} đang hơi căng thẳng. Hãy hỏi xem ${p.object} có muốn nghỉ ngơi một chút không.`,
          `Đừng bàn luận những việc phức tạp hôm nay. Hãy để ${p.subject} có không gian thở.`,
          `Một tin nhắn khích lệ tinh thần sẽ giúp ${p.object} vượt qua những áp lực nhỏ này.`
        ]
        else list = [
          `Hôm nay nên nói chuyện chậm lại. Hãy hỏi xem có việc gì bạn có thể làm giúp ${p.object} không.`,
          `Có một chút áp lực. Hãy thể hiện sự đồng cảm và sẵn sàng chia sẻ gánh nặng.`,
          `Đừng tạo thêm những áp lực vô hình. Sự thoải mái từ bạn sẽ giúp ${p.object} thư giãn.`
        ]
      } else { // high
        if (isFemale) list = [
          `Hôm nay hạn chế tranh luận. Đừng ép ${p.object} phải vui ngay. Hãy giúp ${p.object} giảm tải bằng hành động cụ thể.`,
          `Căng thẳng tột độ. Điều tồi tệ nhất là nói "có gì đâu mà em phải thế". Hãy đứng về phía ${p.object}!`,
          `Hãy trở thành vùng an toàn của ${p.object}. Mọi quyết định quan trọng nên dời sang hôm khác.`
        ]
        else if (isMale) list = [
          `Hôm nay tuyệt đối tránh cãi vã. Nếu ${p.subject} cần không gian yên tĩnh, hãy tôn trọng điều đó.`,
          `Áp lực của ${p.subject} đang rất lớn. Một sự chăm sóc nhẹ nhàng (như chuẩn bị đồ ăn) sẽ hiệu quả hơn lời nói.`,
          `Đừng gặng hỏi lý do. Hãy cứ rót một ly nước, ngồi cạnh và để ${p.subject} tự cân bằng.`
        ]
        else list = [
          `Hôm nay hạn chế tranh luận. Đừng ép ${p.object} phải giải thích nhiều. Hãy giúp ${p.object} giảm tải bằng hành động nhỏ.`,
          `Mức độ căng thẳng rất cao. Sự thấu hiểu và nhẫn nại của bạn lúc này là vàng.`,
          `Hãy dời lại các vấn đề gây mệt mỏi. Tập trung xoa dịu cảm xúc cho ${p.object} trước.`
        ]
      }
    }

    else if (moodType === 'excited') {
      if (isFemale) list = [
        `${p.subject} đang có năng lượng cực tốt. Rất thích hợp để cùng lên kế hoạch cho một buổi hẹn bất ngờ.`,
        `Hãy bắt sóng cảm xúc này! Rủ ${p.object} làm một việc gì đó điên rồ và đáng yêu cùng nhau nhé.`,
        `Đừng làm tụt mood ${p.object} bằng những câu chuyện chán nản. Hãy cùng ${p.object} bay bổng hôm nay.`
      ]
      else if (isMale) list = [
        `${p.subject} đang rất hào hứng! Hãy cùng hoà chung niềm vui hoặc rủ ${p.object} chơi tựa game yêu thích.`,
        `Sự phấn khích này rất đáng quý. Đừng ngần ngại dành lời khen cho những dự định của ${p.subject}.`,
        `Cùng ${p.subject} ăn mừng cảm xúc này bằng một bữa ăn thật ngon nhé.`
      ]
      else list = [
        `${p.subject} đang có năng lượng tốt. Có thể rủ làm điều gì vui vui hoặc cùng lên kế hoạch cho cuối tuần.`,
        `Một ngày tuyệt vời để cùng nhau khám phá điều mới mẻ.`,
        `Hãy cộng hưởng với sự hào hứng này để tạo ra một ngày khó quên.`
      ]
    }

    else if (moodType === 'tired') {
      if (level === 'low') {
        if (isFemale) list = [
          `Hôm nay đừng bắt ${p.object} phải vui ngay. Một món ăn ấm và một lời hỏi han nhẹ là đủ.`,
          `${p.subject} đang hơi đuối sức. Nhắc ${p.object} đi ngủ sớm và đừng thức khuya nhé.`,
          `Hãy thể hiện sự chăm sóc qua hành động nhỏ. Rót một ly nước ấm hoặc tự giác làm việc nhà giúp ${p.object}.`
        ]
        else if (isMale) list = [
          `Hôm nay ${p.subject} có vẻ mệt. Một lời hỏi thăm dịu dàng sẽ xua tan bớt mệt nhọc cho ${p.object}.`,
          `Đừng dỗi nếu ${p.subject} nhắn tin ít hơn hôm nay. ${p.object} chỉ đang cần nạp lại năng lượng thôi.`,
          `Hỏi xem ${p.subject} đã ăn gì chưa và dặn ${p.object} nghỉ ngơi nhé.`
        ]
        else list = [
          `Hôm nay đừng bắt ${p.object} phải vui ngay. Một sự chăm sóc nhẹ nhàng là đủ.`,
          `Hãy nhắc nhở ${p.object} nghỉ ngơi và ăn uống đầy đủ.`,
          `Năng lượng đang giảm. Đừng đòi hỏi quá nhiều sự tập trung từ ${p.object} lúc này.`
        ]
      } else { // high
        if (isFemale) list = [
          `Hôm nay hãy để ${p.object} nghỉ nhiều hơn. Hỏi ít thôi, chăm nhiều hơn. Tuyệt đối không càm ràm.`,
          `Cạn pin rồi! Một cái ôm từ phía sau và câu "ngủ đi em" sẽ là liều thuốc tốt nhất.`,
          `Nhận lấy mọi rắc rối thay ${p.object} hôm nay. Để ${p.subject} hoàn toàn được thư giãn.`
        ]
        else if (isMale) list = [
          `${p.subject} đang thực sự đuối sức. Hãy cho ${p.object} không gian để phục hồi và ngủ một giấc thật sâu.`,
          `Đừng kỳ vọng những cuộc trò chuyện dài hôm nay. Sự thấu hiểu của bạn là điều ${p.object} biết ơn nhất lúc này.`,
          `Chăm sóc ${p.subject} từ những thứ cơ bản nhất: một bữa ăn ngon, một không gian yên tĩnh.`
        ]
        else list = [
          `Hôm nay hãy để ${p.object} nghỉ nhiều hơn. Hỏi ít thôi, chăm nhiều hơn. Có thể chuẩn bị đồ ăn hoặc nước ấm.`,
          `Tình trạng cạn kiệt. Hãy bao dung và làm điểm tựa vững chắc cho ${p.object}.`,
          `Giảm thiểu mọi tương tác đòi hỏi suy nghĩ. Để ${p.object} ngủ và nghỉ ngơi hoàn toàn.`
        ]
      }
    }

    else if (moodType === 'anxious') {
      if (level === 'low') {
        if (isFemale) list = [
          `Hôm nay hãy nói rõ ràng và đừng biến mất quá lâu. Sự ổn định của bạn sẽ giúp ${p.object} yên tâm.`,
          `${p.subject} đang có chút gợn lo. Hãy kiên nhẫn trả lời tin nhắn và trấn an ${p.object} bằng sự xuất hiện của bạn.`,
          `Một hành động khẳng định tình cảm sẽ xoá tan sự bất an nhỏ bé này.`
        ]
        else if (isMale) list = [
          `Hôm nay ${p.subject} đang lo âu chuyện gì đó. Đừng vội phán xét, hãy lắng nghe nếu ${p.object} muốn chia sẻ.`,
          `Hãy thể hiện sự tin tưởng tuyệt đối vào năng lực của ${p.subject}. Sự công nhận từ bạn rất quan trọng.`,
          `Đừng tạo thêm áp lực. Hãy khẳng định rằng mọi chuyện rồi sẽ có cách giải quyết.`
        ]
        else list = [
          `Hôm nay hãy nói rõ ràng và đừng biến mất quá lâu. Sự ổn định của bạn sẽ giúp ${p.object} yên tâm.`,
          `Tránh sự im lặng khó hiểu. Giao tiếp mạch lạc sẽ giúp ${p.object} bớt suy nghĩ lung tung.`,
          `Hãy chứng minh sự đồng hành của bạn bằng những hành động nhất quán.`
        ]
      } else { // high
        if (isFemale) list = [
          `Hôm nay hãy chủ động trấn an. Một câu "anh luôn ở đây bảo vệ em" sẽ có tác dụng hơn bạn nghĩ.`,
          `Bất an tột độ. Đừng để ${p.object} một mình. Hãy vòng tay ôm chặt và hứa sẽ không buông.`,
          `Sự chắc chắn và bao dung của bạn lúc này là chiếc mỏ neo giữ lấy cảm xúc của ${p.object}.`
        ]
        else if (isMale) list = [
          `${p.subject} đang rất căng thẳng vì lo lắng. Hãy nắm tay ${p.object} và nói "chúng ta sẽ vượt qua mà".`,
          `Áp lực tâm lý đang lớn. Đừng so sánh hay chê trách. Sự hiện diện dịu dàng của bạn là liều thuốc giải.`,
          `Hãy kéo ${p.subject} ra khỏi suy nghĩ miên man bằng một cái ôm thật chặt và lâu.`
        ]
        else list = [
          `Hôm nay hãy chủ động trấn an. Một câu "mình luôn ở đây" sẽ có tác dụng hơn bạn nghĩ.`,
          `Mức độ lo lắng báo động. Tuyệt đối tránh tranh cãi và những quyết định bốc đồng.`,
          `Hãy dùng sự bình tĩnh của bạn để dẫn dắt ${p.object} vượt qua cơn bão cảm xúc này.`
        ]
      }
    }

    else if (moodType === 'grateful') {
      if (isFemale) list = [
        `Một ngày rất đẹp để đáp lại bằng sự dịu dàng. Hãy nói rằng bạn cũng trân trọng ${p.object} vô cùng.`,
        `${p.subject} đang đắm chìm trong tình yêu của bạn. Đừng quên gửi lại một lời ngọt ngào nhé!`,
        `Cảm xúc đang thăng hoa. Một bất ngờ nho nhỏ hôm nay sẽ khiến ${p.object} nhớ mãi.`
      ]
      else if (isMale) list = [
        `${p.subject} đang rất trân trọng những gì bạn làm. Hãy mỉm cười và cho ${p.object} biết bạn cũng vui thế nào.`,
        `Đôi khi đàn ông cũng rất cần được ghi nhận. Hãy cảm ơn ${p.subject} vì những điều nhỏ bé anh ấy đã làm.`,
        `Sự kết nối đang rất sâu sắc. Hãy duy trì sự trân trọng lẫn nhau này mỗi ngày nhé.`
      ]
      else list = [
        `Một ngày rất đẹp để đáp lại bằng sự dịu dàng. Hãy nói rằng bạn cũng trân trọng ${p.object}.`,
        `Cảm xúc tích cực đang toả sáng. Sự đáp lại của bạn sẽ làm tăng gấp đôi giá trị của sự biết ơn này.`,
        `Hãy biến cảm xúc này thành một kỷ niệm đẹp đáng nhớ.`
      ]
    }

    if (list.length === 0) return "Hãy quan sát và chăm sóc cảm xúc của đối phương hôm nay."
    const idx = getHashIndex(currentDate, moodType, list.length)
    return list[idx]
  }

  const intensityLevel = intensity <= 2 ? 'low' : 'high'

  switch (mood) {
    case 'happy':
      return {
        weatherTitle: intensityLevel === 'low' ? "NẮNG ẤM" : "NẮNG RỰC RỠ",
        weatherIcon: intensityLevel === 'low' ? "🌤️" : "☀️",
        loveTemp: intensityLevel === 'low' ? "28°C tình cảm" : "32°C yêu thương",
        status: intensityLevel === 'low' ? "Ổn áp" : "Rất đáng yêu",
        warningLevel: intensityLevel === 'low' ? 25 : 15,
        progressLabel: intensityLevel === 'low' ? "Năng lượng dễ thương" : "Năng lượng yêu thương",
        advice: getAdvice(mood, intensityLevel),
        tone: "positive"
      }

    case 'sad':
      return {
        weatherTitle: intensityLevel === 'low' ? "MƯA RÀO" : "BÃO LÒNG",
        weatherIcon: intensityLevel === 'low' ? "🌧️" : "⛈️",
        loveTemp: intensityLevel === 'low' ? "16°C tình cảm" : "8°C cần ôm",
        status: intensityLevel === 'low' ? "Cần quan tâm" : "Cần chăm sóc gấp",
        warningLevel: intensityLevel === 'low' ? 70 : 95,
        progressLabel: intensityLevel === 'low' ? "Mức độ dỗ dành" : "Mức độ nhạy cảm",
        advice: getAdvice(mood, intensityLevel),
        tone: intensityLevel === 'low' ? "careful" : "urgent"
      }

    case 'calm':
      return {
        weatherTitle: "TRỜI YÊN",
        weatherIcon: "🌙",
        loveTemp: "25°C tình cảm",
        status: "Dễ chịu",
        warningLevel: 20,
        progressLabel: "Độ an toàn cảm xúc",
        advice: getAdvice(mood, 'low'), // Calm doesn't split by intensity typically
        tone: "neutral"
      }

    case 'stressed':
      return {
        weatherTitle: intensityLevel === 'low' ? "GIÓ MẠNH" : "ÁP THẤP CẢM XÚC",
        weatherIcon: intensityLevel === 'low' ? "🌬️" : "🌪️",
        loveTemp: intensityLevel === 'low' ? "18°C tình cảm" : "12°C cần bình tĩnh",
        status: intensityLevel === 'low' ? "Nên nhẹ nhàng" : "Tránh gây áp lực",
        warningLevel: intensityLevel === 'low' ? 75 : 92,
        progressLabel: intensityLevel === 'low' ? "Mức áp lực" : "Mức áp lực cao",
        advice: getAdvice(mood, intensityLevel),
        tone: intensityLevel === 'low' ? "careful" : "urgent"
      }

    case 'excited':
      return {
        weatherTitle: "CẦU VỒNG",
        weatherIcon: "🌈",
        loveTemp: "34°C yêu thương",
        status: "Năng lượng cao",
        warningLevel: 10,
        progressLabel: "Năng lượng tích cực",
        advice: getAdvice(mood, 'high'),
        tone: "positive"
      }

    case 'tired':
      return {
        weatherTitle: intensityLevel === 'low' ? "TRỜI SE LẠNH" : "CẠN PIN",
        weatherIcon: intensityLevel === 'low' ? "🌫️" : "💤",
        loveTemp: intensityLevel === 'low' ? "18°C cần nghỉ" : "10°C cần ôm",
        status: intensityLevel === 'low' ? "Cần nghỉ ngơi" : "Cần được chăm",
        warningLevel: intensityLevel === 'low' ? 65 : 88,
        progressLabel: intensityLevel === 'low' ? "Mức cần sạc pin" : "Pin cảm xúc thấp",
        advice: getAdvice(mood, intensityLevel),
        tone: intensityLevel === 'low' ? "careful" : "urgent"
      }

    case 'anxious':
      return {
        weatherTitle: intensityLevel === 'low' ? "SƯƠNG MÙ" : "MÂY ĐEN",
        weatherIcon: intensityLevel === 'low' ? "🌫️" : "☁️",
        loveTemp: intensityLevel === 'low' ? "17°C bất an" : "11°C cần an toàn",
        status: intensityLevel === 'low' ? "Cần trấn an" : "Cần cảm giác an toàn",
        warningLevel: intensityLevel === 'low' ? 72 : 90,
        progressLabel: intensityLevel === 'low' ? "Mức bất an" : "Mức lo lắng cao",
        advice: getAdvice(mood, intensityLevel),
        tone: intensityLevel === 'low' ? "careful" : "urgent"
      }

    case 'grateful':
      return {
        weatherTitle: "NẮNG DỊU",
        weatherIcon: "✨",
        loveTemp: "29°C ấm áp",
        status: "Ấm lòng",
        warningLevel: 15,
        progressLabel: "Độ ấm áp",
        advice: getAdvice(mood, 'low'),
        tone: "positive"
      }

    default:
      return {
        weatherTitle: "CHỜ DỮ LIỆU",
        weatherIcon: "☁️",
        loveTemp: "--°C",
        status: "Chưa rõ",
        warningLevel: 0,
        progressLabel: "Đang phân tích",
        advice: "Hãy chờ người ấy chia sẻ cảm xúc để biết cách chăm sóc tốt nhất nhé.",
        tone: "neutral"
      }
  }
}
