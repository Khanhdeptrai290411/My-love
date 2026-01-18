import mongoose, { Schema, model, models } from 'mongoose'

export interface IDailyQuote {
  _id: string
  coupleId: string
  date: string // YYYY-MM-DD
  text: string
  source: 'db' | 'fallback'
  createdAt: Date
}

const DailyQuoteSchema = new Schema<IDailyQuote>({
  coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  date: { type: String, required: true },
  text: { type: String, required: true },
  source: { type: String, enum: ['db', 'fallback'], default: 'fallback' },
  createdAt: { type: Date, default: Date.now },
})

DailyQuoteSchema.index({ coupleId: 1, date: 1 }, { unique: true })

export const DailyQuote = models.DailyQuote || model<IDailyQuote>('DailyQuote', DailyQuoteSchema)

