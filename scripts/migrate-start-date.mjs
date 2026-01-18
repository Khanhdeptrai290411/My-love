import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Please add your MONGODB_URI to .env.local')
  process.exit(1)
}

const CoupleSchema = new mongoose.Schema({
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  inviteCode: { type: String, required: true, unique: true },
  startDate: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
})

const Couple = mongoose.models.Couple || mongoose.model('Couple', CoupleSchema)

async function migrateStartDate() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const couples = await Couple.find({ startDate: { $exists: false } })
    console.log(`📋 Found ${couples.length} couples without startDate`)

    if (couples.length === 0) {
      console.log('✅ All couples already have startDate')
      return
    }

    for (const couple of couples) {
      console.log(`\n📝 Processing couple: ${couple._id}`)
      console.log(`   Invite code: ${couple.inviteCode}`)
      
      // Try to decode date from invite code
      const inviteCode = couple.inviteCode
      if (inviteCode.length >= 6) {
        try {
          const day = inviteCode.substring(0, 2)
          const month = inviteCode.substring(2, 4)
          const year = `20${inviteCode.substring(4, 6)}`
          const dateString = `${year}-${month}-${day}`
          
          // Validate date
          const testDate = new Date(dateString)
          if (!isNaN(testDate.getTime())) {
            couple.startDate = dateString
            await couple.save()
            console.log(`   ✅ Set startDate to: ${dateString}`)
          } else {
            console.log(`   ⚠️  Could not decode date from invite code, setting to createdAt date`)
            const createdAtDate = new Date(couple.createdAt)
            couple.startDate = createdAtDate.toISOString().split('T')[0]
            await couple.save()
            console.log(`   ✅ Set startDate to: ${couple.startDate}`)
          }
        } catch (error) {
          console.log(`   ⚠️  Error decoding date, using createdAt`)
          const createdAtDate = new Date(couple.createdAt)
          couple.startDate = createdAtDate.toISOString().split('T')[0]
          await couple.save()
          console.log(`   ✅ Set startDate to: ${couple.startDate}`)
        }
      } else {
        console.log(`   ⚠️  Invite code format not recognized, using createdAt date`)
        const createdAtDate = new Date(couple.createdAt)
        couple.startDate = createdAtDate.toISOString().split('T')[0]
        await couple.save()
        console.log(`   ✅ Set startDate to: ${couple.startDate}`)
      }
    }

    console.log(`\n✅ Migration completed! Updated ${couples.length} couples.`)

  } catch (error) {
    console.error('❌ Migration error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
  }
}

migrateStartDate()

