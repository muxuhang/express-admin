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
  phone: {
    type: String,
    unique: true,
    sparse: true, // 允许空值，但如果有值则必须唯一
    validate: {
      validator: function(v) {
        // 如果手机号为空，则验证通过
        if (!v) return true
        // 如果手机号不为空，则验证格式
        return /^1\d{10}$/.test(v)
      },
      message: '手机号格式不正确'
    }
  },
  role: {
    type: String,
    default: 'user',
    select: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
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
  lastLoginAt: {
    type: Date,
    default: null,
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
