import mongoose, { Schema, model, models } from 'mongoose'

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

export interface IReaction {
  _id: string
  postId: string
  userId: string
  type: ReactionType
  createdAt: Date
}

const ReactionSchema = new Schema<IReaction>({
  postId: { type: Schema.Types.ObjectId as any, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'], required: true },
  createdAt: { type: Date, default: Date.now },
})

// One reaction per user per post (user can change reaction type)
ReactionSchema.index({ postId: 1, userId: 1 }, { unique: true })

export const Reaction = models.Reaction || model<IReaction>('Reaction', ReactionSchema)
