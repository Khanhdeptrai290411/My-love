import mongoose, { Schema, model, models } from 'mongoose'

export interface IComment {
  _id: string
  postId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  text: string
  createdAt: Date
  parentCommentId?: mongoose.Types.ObjectId | null
}

const CommentSchema = new Schema<IComment>({
  postId: { type: Schema.Types.ObjectId as any, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  parentCommentId: { type: Schema.Types.ObjectId as any, ref: 'Comment', default: null },
})

CommentSchema.index({ postId: 1, createdAt: -1 })

export const Comment = models.Comment || model<IComment>('Comment', CommentSchema)

