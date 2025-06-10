import mongoose from 'mongoose'

const LoginLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  login_time: {
    type: Date,
    default: Date.now
  },
  ip_address: {
    type: String,
    required: true
  },
  user_agent: {
    type: String,
    required: true
  },
  login_source: {
    type: String,
    enum: ['pc', 'h5'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  fail_reason: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// 检查模型是否已经存在
const LoginLog = mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema)

export default LoginLog 