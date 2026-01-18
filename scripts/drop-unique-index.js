// Script to drop the unique index on authorId and date
// Run this once: node scripts/drop-unique-index.js

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('posts')

    // Drop the unique index
    try {
      await collection.dropIndex('authorId_1_date_1')
      console.log('✅ Successfully dropped unique index: authorId_1_date_1')
    } catch (error) {
      if (error.code === 27) {
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
    console.log('\n✅ Done!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

dropIndex()

