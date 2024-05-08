import mongoose from 'mongoose'
var Schema = mongoose.Schema

// users
export const UsersModelSchema = new Schema({
  username: String,
  telphone: String,
  number: Number,
  sex: String,
  email: String,
  password: String,
  updated_at: Date,
  last_login_at: Date,
  created_at: Date,
})
