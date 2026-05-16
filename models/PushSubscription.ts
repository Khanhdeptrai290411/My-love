import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  coupleId?: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  platform?: string;
  deviceName?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coupleId: { type: Schema.Types.ObjectId, ref: 'Couple' },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userAgent: { type: String },
  platform: { type: String },
  deviceName: { type: String },
  enabled: { type: Boolean, default: true }
}, {
  timestamps: true
})

// Index for querying by user
PushSubscriptionSchema.index({ userId: 1 })

export const PushSubscription: Model<IPushSubscription> = 
  mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema)
