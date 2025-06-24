import mongoose from 'mongoose'

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    trim: true
  }],
  is_system: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

// 更新时自动更新 updated_at 字段
RoleSchema.pre('save', function(next) {
  this.updated_at = Date.now()
  next()
})

// 检查模型是否已经存在
const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema)

// 初始化默认角色
const initDefaultRoles = async (retryCount = 0) => {
  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      console.log('数据库未连接，等待连接完成...')
      if (retryCount < 5) {
        setTimeout(() => initDefaultRoles(retryCount + 1), 2000)
      }
      return
    }

    // 等待一小段时间确保连接稳定
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 检查是否已存在默认角色
    const adminRole = await Role.findOne({ code: 'admin' })
    const userRole = await Role.findOne({ code: 'user' })

    // 创建管理员角色
    if (!adminRole) {
      await Role.create({
        name: '管理员',
        code: 'admin',
        description: '系统管理员，拥有所有权限',
        permissions: ['*'],
        is_system: true
      })
      console.log('管理员角色创建成功')
    }

    // 创建普通用户角色
    if (!userRole) {
      await Role.create({
        name: '普通用户',
        code: 'user',
        description: '普通用户，拥有基本权限',
        permissions: ['view_profile', 'edit_profile'],
        is_system: true
      })
      console.log('普通用户角色创建成功')
    }

    console.log('默认角色初始化完成')
  } catch (error) {
    console.error('初始化默认角色失败:', error)
    
    // 如果是连接错误且重试次数未达到上限，则重试
    if (error.name === 'MongoNotConnectedError' && retryCount < 5) {
      console.log(`重试初始化角色... (${retryCount + 1}/5)`)
      setTimeout(() => initDefaultRoles(retryCount + 1), 3000)
    }
  }
}

// 监听数据库连接事件，在连接成功后初始化角色
mongoose.connection.on('connected', () => {
  console.log('数据库连接成功，开始初始化默认角色...')
  // 延迟执行，确保连接完全稳定
  setTimeout(() => initDefaultRoles(), 2000)
})

// 导出模型和初始化函数
export { initDefaultRoles }
export default Role 