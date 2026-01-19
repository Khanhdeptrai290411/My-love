import mongoose, { Schema, model, models } from 'mongoose'

export interface IMoodEvent {
  _id: string
  coupleId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  date: string // YYYY-MM-DD
  mood: 'happy' | 'sad' | 'calm' | 'stressed' | 'excited' | 'tired' | 'anxious' | 'grateful'
  intensity: number // 0-3
  note?: string
  createdAt: Date
}

const MoodEventSchema = new Schema<IMoodEvent>({
  coupleId: { type: Schema.Types.ObjectId as any, ref: 'Couple', required: true },
  userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  date: { type: String, required: true },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'calm', 'stressed', 'excited', 'tired', 'anxious', 'grateful'],
    required: true,
  },
  intensity: { type: Number, required: true, min: 0, max: 3 },
  note: String,
  createdAt: { type: Date, default: Date.now },
})

// Indexes for efficient queries
MoodEventSchema.index({ coupleId: 1, date: 1 })
MoodEventSchema.index({ userId: 1, date: 1 })

export const MoodEvent = models.MoodEvent || model<IMoodEvent>('MoodEvent', MoodEventSchema)

