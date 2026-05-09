import mongoose, { Schema, model, models } from 'mongoose'

export interface IAnniversary {
  _id: string
  coupleId: string
  title: string
  date: Date
  description?: string
  createdAt: Date
}

const AnniversarySchema = new Schema<IAnniversary>({
  coupleId: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
})

AnniversarySchema.index({ coupleId: 1 })

export const Anniversary = models.Anniversary || model<IAnniversary>('Anniversary', AnniversarySchema)
