import mongoose, { Schema, model, models } from 'mongoose'

export interface IUser {
  _id: string
  name: string
  email: string
  image?: string
  gender?: 'male' | 'female' | 'other'
  password?: string
  createdAt: Date
  height?: string
  weight?: string
  measurements?: {
    bust?: string
    waist?: string
    hips?: string
  }
  shoeSize?: string
  clothingSize?: string
  ringSize?: string
  personalNote?: string
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: String,
  gender: { type: String, enum: ['male', 'female', 'other'], default: undefined },
  password: String,
  createdAt: { type: Date, default: Date.now },
  height: String,
  weight: String,
  measurements: {
    bust: String,
    waist: String,
    hips: String,
  },
  shoeSize: String,
  clothingSize: String,
  ringSize: String,
  personalNote: String,
})

export const User = models.User || model<IUser>('User', UserSchema)

