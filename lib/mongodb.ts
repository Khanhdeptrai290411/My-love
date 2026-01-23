import mongoose from 'mongoose'

const MONGODB_URI: string = process.env.MONGODB_URI || ''

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please add your MONGODB_URI to .env.local')
  }

  // Check if connection is ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // If connection exists but is not ready, reset it
  if (cached.conn && mongoose.connection.readyState !== 1) {
    console.log('MongoDB connection not ready, resetting...')
    cached.conn = null
    cached.promise = null
    await mongoose.disconnect().catch(() => {}) // Ignore disconnect errors
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      maxPoolSize: 5, // Reduced pool size
      minPoolSize: 0, // Don't maintain persistent connections
      maxIdleTimeMS: 10000, // Close idle connections quickly
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000, // Check connection health every 10s
    }
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully')
      return mongoose
    }).catch((error) => {
      console.error('MongoDB connection failed:', error.message)
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready after connect')
    }
  } catch (e) {
    cached.promise = null
    cached.conn = null
    throw e
  }

  return cached.conn
}

export default connectDB

