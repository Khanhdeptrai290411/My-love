import { v2 as cloudinary } from 'cloudinary'

// Config Cloudinary (signed upload với API key/secret, không cần preset)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  // Convert File -> Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Signed upload bằng upload_stream (SDK tự động sign với api_key/api_secret)
  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'my-love-app',
        resource_type: 'image',
      },
      (error, res) => {
        if (error) return reject(error)
        if (!res) return reject(new Error('Upload failed: no result'))
        resolve(res)
      }
    )
    stream.end(buffer)
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

/** Upload unsigned với preset (fallback nếu signed upload fail) */
export async function uploadImageUnsigned(
  file: File,
  preset: string = 'my_love_unsigned'
): Promise<{ url: string; publicId: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        upload_preset: preset,
        folder: 'my-love-app',
        resource_type: 'image',
      },
      (error, res) => {
        if (error) return reject(error)
        if (!res) return reject(new Error('Upload failed: no result'))
        resolve(res)
      }
    )
    stream.end(buffer)
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

/** Upload bằng REST API trực tiếp (bypass SDK để debug) */
export async function uploadImageDirectREST(
  file: File,
  preset: string = 'my_love_unsigned'
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', preset)
  formData.append('folder', 'my-love-app')

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    let errorData: any = null
    try {
      errorData = JSON.parse(text)
    } catch {
      // Nếu không parse được JSON, trả về text
      throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}. Response: ${text.slice(0, 500)}`)
    }
    throw new Error(errorData.error?.message || `Cloudinary upload failed: ${response.status}`)
  }

  const result = await response.json()
  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

/** Upload from buffer (e.g. base64 decoded). Dùng cho migration ảnh cũ lên Cloudinary. */
export async function uploadImageFromBuffer(
  buffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'my-love-app',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        })
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

