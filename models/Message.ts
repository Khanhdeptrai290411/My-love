import mongoose, { Schema, model, models } from 'mongoose'

export interface IMessage {
  _id: string
  coupleId: string
  senderId: string
  text?: string
  imageUrl?: string
  audioUrl?: string
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
  coupleId: { type: Schema.Types.ObjectId as any, ref: 'Couple', required: true },
  senderId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  text: { type: String, required: false },
  imageUrl: String,
  audioUrl: String,
  createdAt: { type: Date, default: Date.now },
})

MessageSchema.index({ coupleId: 1, createdAt: -1 })

export const Message = models.Message || model<IMessage>('Message', MessageSchema)

