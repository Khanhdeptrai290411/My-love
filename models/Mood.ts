import mongoose, { Schema, model, models } from 'mongoose'

export type MoodType = 'happy' | 'sad' | 'calm' | 'stressed' | 'excited' | 'tired' | 'anxious' | 'grateful'

export interface IMood {
  _id: string
  coupleId: string
  userId: string
  date: string // YYYY-MM-DD
  mood: MoodType
  intensity: number // 0-3
  note?: string
  createdAt: Date
}

const MoodSchema = new Schema<IMood>({
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

MoodSchema.index({ coupleId: 1, date: 1 })
MoodSchema.index({ userId: 1, date: 1 }, { unique: true })

export const Mood = models.Mood || model<IMood>('Mood', MoodSchema)

