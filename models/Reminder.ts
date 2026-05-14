import mongoose, { Schema, model, models } from 'mongoose'

export interface IReminder {
  _id: string
  coupleId: string
  title: string
  content: string
  startDate: Date
  endDate: Date
  icon: string
  isActive: boolean
  createdAt: Date
}

const ReminderSchema = new Schema<IReminder>({
  coupleId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  icon: { type: String, default: '✨' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

ReminderSchema.index({ coupleId: 1 })

export const Reminder = models.Reminder || model<IReminder>('Reminder', ReminderSchema)
