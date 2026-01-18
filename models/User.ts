import mongoose, { Schema, model, models } from 'mongoose'

export interface IUser {
  _id: string
  name: string
  email: string
  image?: string
  password?: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: String,
  password: String,
  createdAt: { type: Date, default: Date.now },
})

export const User = models.User || model<IUser>('User', UserSchema)

