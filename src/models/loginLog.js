import mongoose from 'mongoose'

const LoginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  loginSource: {
    type: String,
    enum: ['pc', 'h5'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  failReason: {
    type: String
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})

// 检查模型是否已经存在
const LoginLog = mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema)

export default LoginLog 