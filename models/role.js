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
const initDefaultRoles = async () => {
  try {
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
    }
  } catch (error) {
    console.error('初始化默认角色失败:', error)
  }
}

// 执行初始化
initDefaultRoles()

export default Role 