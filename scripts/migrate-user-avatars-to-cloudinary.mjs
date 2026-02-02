/**
 * Script: chuyển avatar user dạng base64 lên Cloudinary.
 * - Tìm tất cả User có `image` là data URL (data:*;base64,...)
 * - Upload lên Cloudinary (folder `my-love-avatar`)
 * - Cập nhật lại trường `image` = URL Cloudinary
 *
 * Chạy từ thư mục my-love:
 *   node scripts/migrate-user-avatars-to-cloudinary.mjs
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
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

/** Upload buffer avatar lên Cloudinary, trả về { url, publicId } */
function uploadAvatar(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'my-love-avatar',
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

async function run() {
  try {
    console.log('👤 Bắt đầu migrate avatar user (base64 → Cloudinary)...\n')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Đã kết nối MongoDB')

    const collection = mongoose.connection.db.collection('users')
    const users = await collection
      .find({ image: { $type: 'string', $regex: /^data:/ } })
      .toArray()

    console.log(`📋 Tìm thấy ${users.length} user có avatar base64`)
    if (users.length === 0) {
      console.log('✅ Không có avatar base64 nào, không cần migrate.')
      return
    }

    let migrated = 0
    const errors = []

    for (const u of users) {
      const dataUrl = u.image
      const parsed = parseDataUrl(dataUrl)
      if (!parsed) {
        errors.push(`User ${u._id}: không parse được data URL`)
        continue
      }

      try {
        const result = await uploadAvatar(parsed.buffer)
        await collection.updateOne(
          { _id: u._id },
          { $set: { image: result.url } }
        )
        migrated += 1
        console.log(`✅ User ${u._id}: migrated avatar → ${result.url}`)
      } catch (err) {
        errors.push(`User ${u._id}: ${err?.message || 'upload failed'}`)
      }
    }

    console.log(`\n✅ Xong. Đã migrate avatar cho ${migrated}/${users.length} user.`)
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

