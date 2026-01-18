import mongoose, { Schema, model, models } from 'mongoose'

export interface ICouple {
  _id: string
  memberIds: string[]
  inviteCode: string
  startDate: string // YYYY-MM-DD - Ngày hẹn hò
  createdAt: Date
}

const CoupleSchema = new Schema<ICouple>({
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  inviteCode: { type: String, required: true, unique: true },
  startDate: { type: String, required: false }, // Ngày hẹn hò - optional để tương thích với document cũ
  createdAt: { type: Date, default: Date.now },
})

CoupleSchema.index({ memberIds: 1 })

export const Couple = models.Couple || model<ICouple>('Couple', CoupleSchema)

