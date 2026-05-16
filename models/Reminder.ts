import mongoose, { Schema, model, models } from 'mongoose'

export interface IReminder {
  userId?: string
  coupleId: string
  title: string
  content: string
  startDate: string
  endDate: string
  remindStartTime: string
  remindEndTime: string
  timezone: string
  icon: string
  isActive: boolean
  createdAt: Date
}

const ReminderSchema = new Schema<IReminder>({
  userId: { type: String },
  coupleId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  remindStartTime: { type: String, required: true },
  remindEndTime: { type: String, required: true },
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
  icon: { type: String, default: '✨' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})
ReminderSchema.index({ coupleId: 1 })

export const Reminder = models.Reminder || model<IReminder>('Reminder', ReminderSchema)
