import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotificationSetting extends Document {
  userId: mongoose.Types.ObjectId;
  coupleId?: mongoose.Types.ObjectId;
  
  pushEnabled: boolean;
  streakEnabled: boolean;
  anniversaryEnabled: boolean;
  customReminderEnabled: boolean;
  moodEnabled: boolean;
  cycleEnabled: boolean;
  dailyMessageEnabled: boolean;
  inactiveEnabled: boolean;
  
  cycleWordingMode: 'private' | 'clear';
  
  reminderTimes: {
    streak: string;
    mood: string;
    dailyMessage: string;
    cycle: string;
    anniversary: string;
  };
  
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingSchema = new Schema<INotificationSetting>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  coupleId: { type: Schema.Types.ObjectId, ref: 'Couple' },
  
  pushEnabled: { type: Boolean, default: false },
  streakEnabled: { type: Boolean, default: true },
  anniversaryEnabled: { type: Boolean, default: true },
  customReminderEnabled: { type: Boolean, default: true },
  moodEnabled: { type: Boolean, default: true },
  cycleEnabled: { type: Boolean, default: true },
  dailyMessageEnabled: { type: Boolean, default: true },
  inactiveEnabled: { type: Boolean, default: true },
  
  cycleWordingMode: { type: String, enum: ['private', 'clear'], default: 'private' },
  
  reminderTimes: {
    streak: { type: String, default: '21:30' },
    mood: { type: String, default: '20:00' },
    dailyMessage: { type: String, default: '19:00' },
    cycle: { type: String, default: '08:00' },
    anniversary: { type: String, default: '09:00' }
  },
  
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
}, {
  timestamps: true
})

export const NotificationSetting: Model<INotificationSetting> = 
  mongoose.models.NotificationSetting || mongoose.model<INotificationSetting>('NotificationSetting', NotificationSettingSchema)
