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
  menuIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 更新时自动更新 updatedAt 字段
RoleSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// 检查模型是否已经存在
const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema)

// 初始化默认角色
const initDefaultRoles = async (retryCount = 0) => {
  try {
    console.log('开始初始化默认角色...')

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
        status: 'active',
        isSystem: true
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
        status: 'active',
        isSystem: false
      })
      console.log('普通用户角色创建成功')
    }

    console.log('默认角色初始化完成')
  } catch (error) {
    console.error('初始化默认角色失败:', error)
    
    // 如果是连接错误且重试次数未达到上限，则重试
    if ((error.name === 'MongoNotConnectedError' || error.message.includes('connection')) && retryCount < 3) {
      console.log(`重试初始化角色... (${retryCount + 1}/3)`)
      setTimeout(() => initDefaultRoles(retryCount + 1), 2000)
    }
  }
}

// 导出模型和初始化函数
export { initDefaultRoles }
export default Role 