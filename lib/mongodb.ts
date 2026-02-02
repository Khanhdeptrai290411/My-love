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

/** Clear cached connection so next connectDB() creates a fresh one. Call on connection errors. */
export function clearMongoCache() {
  cached.conn = null
  cached.promise = null
  if (global.mongoose) {
    global.mongoose.conn = null
    global.mongoose.promise = null
  }
  mongoose.disconnect().catch(() => {})
}

function isConnectionError(err: any): boolean {
  const msg = err?.message?.toLowerCase() ?? ''
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('closed') ||
    msg.includes('interrupted') ||
    msg.includes('not connected') ||
    err?.name === 'MongoNotConnectedError' ||
    err?.name === 'MongoServerSelectionError' ||
    err?.name === 'MongoNetworkError'
  )
}

export { isConnectionError }

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please add your MONGODB_URI to .env.local')
  }

  // Reuse existing connection only if really ready (serverless can freeze and close it)
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // Stale or dead connection: clear and disconnect so we get a fresh connect
  if (cached.conn || cached.promise) {
    console.log('MongoDB connection not ready or stale, resetting...')
    clearMongoCache()
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000, // 10s to pick server (slow networks)
    connectTimeoutMS: 10000, // 10s to establish connection
    socketTimeoutMS: 60000, // 60s per operation (high latency to Atlas)
    maxPoolSize: 2,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    retryWrites: true,
    retryReads: true,
  }

  cached.promise = mongoose
    .connect(MONGODB_URI, opts)
    .then((m) => {
      console.log('MongoDB connected')
      return m
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err?.message)
      cached.promise = null
      cached.conn = null
      throw err
    })

  try {
    cached.conn = await cached.promise
    if (mongoose.connection.readyState !== 1) {
      clearMongoCache()
      throw new Error('MongoDB connection not ready after connect')
    }
  } catch (e) {
    clearMongoCache()
    throw e
  }

  return cached.conn
}

export default connectDB

