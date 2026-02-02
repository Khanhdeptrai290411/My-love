// Utility functions

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Generate invite code from date (format: YYYY-MM-DD)
export function generateInviteCodeFromDate(date: string): string {
  // Simple hash: convert date to number and encode to base36
  const dateStr = date.replace(/-/g, '') // Remove dashes: 20201203
  const num = parseInt(dateStr, 10)
  const code = num.toString(36).toUpperCase().padStart(8, '0')
  return code.substring(0, 8) // 8 characters
}

// Decode date from invite code
export function decodeDateFromInviteCode(code: string): string | null {
  try {
    const num = parseInt(code.toLowerCase(), 36)
    const dateStr = num.toString().padStart(8, '0')
    if (dateStr.length !== 8) return null
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}

// Calculate days in love
export function calculateDaysInLove(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Compress và resize ảnh trước khi upload để giảm kích thước file và tăng tốc độ upload
 * @param file File ảnh gốc
 * @param maxWidth Chiều rộng tối đa (mặc định 1920px)
 * @param maxHeight Chiều cao tối đa (mặc định 1920px)
 * @param quality Chất lượng JPEG (0-1, mặc định 0.85)
 * @returns Promise<File> File ảnh đã được compress
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Tính toán kích thước mới giữ nguyên tỷ lệ
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // Tạo canvas và vẽ ảnh đã resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Không thể tạo canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert sang Blob với quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Không thể compress ảnh'))
              return
            }

            // Tạo File mới từ Blob (giữ nguyên tên file và type)
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Luôn dùng JPEG để compress tốt hơn
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Không thể load ảnh'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Không thể đọc file'))
    reader.readAsDataURL(file)
  })
}

