import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    select: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// 更新时自动更新 updatedAt 字段
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

// 检查模型是否已经存在
const User = mongoose.models.User || mongoose.model('User', UserSchema)

export default User
