/**
 * Script chạy riêng:
 * 1. Chuyển tất cả ảnh base64 thành PNG
 * 2. Upload PNG lên Cloudinary
 * 3. Cập nhật đường dẫn từng bài viết trong DB (url từ Cloudinary)
 *
 * Cần: .env.local có MONGODB_URI, CLOUDINARY_*.
 * Chạy từ thư mục my-love: node scripts/migrate-images-to-cloudinary.mjs
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { v2 as cloudinary } from 'cloudinary'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!MONGODB_URI) {
  console.error('❌ Thiếu MONGODB_URI trong .env.local')
  process.exit(1)
}
if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Thiếu CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET trong .env.local')
  process.exit(1)
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
})

/** Parse data URL (data:image/jpeg;base64,...) → { mimeType, buffer } */
function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/)
  if (!match) return null
  const mimeType = match[1].trim()
  const base64 = match[2].replace(/\s/g, '')
  try {
    const buffer = Buffer.from(base64, 'base64')
    return buffer.length > 0 ? { mimeType, buffer } : null
  } catch {
    return null
  }
}

const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024 // 10MB giới hạn Cloudinary

/**
 * Chuẩn bị ảnh để upload: PNG nếu nhỏ, nếu > 10MB thì resize hoặc chuyển JPEG để dưới 10MB.
 * Trả về { buffer, format: 'png' | 'jpg' }.
 */
async function prepareForCloud(buffer) {
  let buf = await sharp(buffer).png().toBuffer()
  if (buf.length <= CLOUDINARY_MAX_BYTES) return { buffer: buf, format: 'png' }

  const resized = sharp(buffer).resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
  buf = await resized.png().toBuffer()
  if (buf.length <= CLOUDINARY_MAX_BYTES) return { buffer: buf, format: 'png' }

  for (const quality of [85, 75, 60]) {
    buf = await sharp(buffer).resize(1920, 1920, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality }).toBuffer()
    if (buf.length <= CLOUDINARY_MAX_BYTES) return { buffer: buf, format: 'jpg' }
  }
  buf = await sharp(buffer).resize(1280, 1280, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 50 }).toBuffer()
  return { buffer: buf, format: 'jpg' }
}

/** Upload buffer lên Cloudinary (format 'png' hoặc 'jpg'), có retry khi timeout. Trả về { url, publicId }. */
function uploadToCloud(buffer, format, retries = 2) {
  return new Promise((resolve, reject) => {
    const doUpload = (attempt) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'my-love-app',
          resource_type: 'image',
          format,
        },
        (error, result) => {
          if (error) {
            const isTimeout = /timeout|Timeout/i.test(error.message || '')
            if (isTimeout && attempt < retries) {
              doUpload(attempt + 1)
              return
            }
            reject(error)
            return
          }
          if (!result) {
            reject(new Error('Upload failed'))
            return
          }
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      uploadStream.end(buffer)
    }
    doUpload(0)
  })
}

async function run() {
  try {
    console.log('📷 Quy trình: base64 → PNG → upload Cloudinary → sửa đường dẫn từng bài viết\n')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Đã kết nối MongoDB')

    const collection = mongoose.connection.db.collection('posts')
    const BATCH_SIZE = 15
    console.log(`📋 Đang duyệt từng batch ${BATCH_SIZE} bài (tránh cursor timeout)...`)

    let migratedPosts = 0
    let migratedImages = 0
    let totalPosts = 0
    let skip = 0
    const errors = []

    while (true) {
      const posts = await collection
        .find({})
        .sort({ createdAt: 1 })
        .project({ _id: 1, images: 1 })
        .skip(skip)
        .limit(BATCH_SIZE)
        .toArray()

      if (posts.length === 0) break
      if (totalPosts === 0) console.log('   Bắt đầu xử lý batch đầu...')

      for (const p of posts) {
        totalPosts += 1
        if (totalPosts > 1 && totalPosts % 20 === 0) {
          console.log(`\n   Đã duyệt ${totalPosts} bài, đã chuyển ${migratedImages} ảnh...`)
        }
        const rawImages = p.images
        const images = Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : []
      if (images.length === 0) continue

      let hasChange = false
      const newImages = []

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const url = typeof img === 'string' ? img : (typeof img?.url === 'string' ? img.url : '')
        if (!url.startsWith('data:')) {
          newImages.push({ url, publicId: img?.publicId })
          continue
        }

        const parsed = parseDataUrl(url)
        if (!parsed) {
          errors.push(`Post ${p._id} ảnh ${i + 1}: không parse được data URL`)
          newImages.push({ url, publicId: img?.publicId })
          continue
        }

        try {
          const { buffer: uploadBuffer, format } = await prepareForCloud(parsed.buffer)
          const result = await uploadToCloud(uploadBuffer, format)
          newImages.push({ url: result.url, publicId: result.publicId })
          hasChange = true
          migratedImages += 1
          process.stdout.write('.')
        } catch (err) {
          errors.push(`Post ${p._id} ảnh ${i + 1}: ${err?.message || 'upload failed'}`)
          newImages.push({ url, publicId: img?.publicId })
        }
      }

      if (hasChange) {
        await collection.updateOne(
          { _id: p._id },
          { $set: { images: newImages } }
        )
        migratedPosts += 1
      }
      }

      skip += BATCH_SIZE
    }

    if (migratedImages > 0) console.log('')
    console.log(`\n✅ Xong. Đã duyệt ${totalPosts} bài, chuyển ${migratedImages} ảnh trong ${migratedPosts} bài đăng lên Cloudinary.`)
    if (errors.length > 0) {
      console.log('\n⚠️ Lỗi:')
      errors.forEach((e) => console.log('  ', e))
    }
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('✅ Đã ngắt kết nối MongoDB')
  }
}

run()
