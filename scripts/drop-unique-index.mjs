// Script to drop the unique index on authorId and date
// Run this: node scripts/drop-unique-index.mjs

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function dropIndex() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env.local')
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('posts')

    // Drop the unique index
    try {
      await collection.dropIndex('authorId_1_date_1')
      console.log('✅ Successfully dropped unique index: authorId_1_date_1')
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index does not exist (already dropped or never created)')
      } else {
        throw error
      }
    }

    // List remaining indexes
    const indexes = await collection.indexes()
    console.log('\n📋 Current indexes:')
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`)
    })

    await mongoose.disconnect()
    console.log('\n✅ Done! Bây giờ bạn có thể đăng nhiều post trong 1 ngày.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

dropIndex()

