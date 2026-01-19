import mongoose, { Schema, model, models } from 'mongoose'

export interface IPostImage {
  url: string // Can be Cloudinary URL or base64 data URL
  publicId?: string // Optional, only for Cloudinary
}

export interface IPost {
  _id: string
  coupleId: string
  authorId: string
  date: string // YYYY-MM-DD
  content: string
  images: IPostImage[]
  starred: boolean
  createdAt: Date
}

const PostSchema = new Schema<IPost>({
  coupleId: { type: Schema.Types.ObjectId as any, ref: 'Couple', required: true },
  authorId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  date: { type: String, required: true },
  content: { type: String, required: true },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String }, // Optional, only for Cloudinary
  }],
  starred: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

PostSchema.index({ coupleId: 1, date: -1 })
PostSchema.index({ authorId: 1, date: 1 }) // Removed unique constraint to allow multiple posts per day

export const Post = models.Post || model<IPost>('Post', PostSchema)

