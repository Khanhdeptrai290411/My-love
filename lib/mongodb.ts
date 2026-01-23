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

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout (reduced for faster failure)
      socketTimeoutMS: 30000, // 30 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      retryWrites: true,
      retryReads: true,
    }
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB

