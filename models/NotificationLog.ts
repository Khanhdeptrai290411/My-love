import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  coupleId?: mongoose.Types.ObjectId;
  type: 'streak' | 'anniversary' | 'customReminder' | 'mood' | 'cycle' | 'dailyMessage' | 'inactive' | 'test';
  dedupeKey: string;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  status: 'sent' | 'failed' | 'skipped';
  readAt?: Date;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coupleId: { type: Schema.Types.ObjectId, ref: 'Couple' },
  type: { 
    type: String, 
    enum: ['streak', 'anniversary', 'customReminder', 'mood', 'cycle', 'dailyMessage', 'inactive', 'test'],
    required: true 
  },
  dedupeKey: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  icon: { type: String },
  actionUrl: { type: String },
  status: { type: String, enum: ['sent', 'failed', 'skipped'], required: true },
  readAt: { type: Date },
  sentAt: { type: Date },
  errorMessage: { type: String }
}, {
  timestamps: true
})

// Indexes
NotificationLogSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true })
NotificationLogSchema.index({ userId: 1, createdAt: -1 })
NotificationLogSchema.index({ coupleId: 1, createdAt: -1 })

export const NotificationLog: Model<INotificationLog> = 
  mongoose.models.NotificationLog || mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema)
