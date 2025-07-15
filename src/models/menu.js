import mongoose from 'mongoose'

const MenuSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    unique: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
    trim: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
  icon: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
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
MenuSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

// 保存前自动生成 key 字段（如果未提供）
MenuSchema.pre('save', function (next) {
  if (!this.key && this._id) {
    this.key = this._id.toString()
  }
  next()
})

// 初始化默认菜单
MenuSchema.statics.initDefaultMenus = async function () {
  try {
    // 检查是否已有菜单数据
    const menuCount = await this.countDocuments()

    if (menuCount === 0) {
      console.log('初始化默认菜单...')

      // 默认菜单配置 - 使用 Ant Design 图标
      const defaultMenus = [
        {
          label: '首页',
          path: '/',
          order: 1,
          icon: 'HomeOutlined',
          status: 'active',
        },
        {
          label: '用户管理',
          path: '/users',
          order: 2,
          icon: 'UserOutlined',
          status: 'active',
        },
        {
          label: '角色管理',
          path: '/roles',
          order: 3,
          icon: 'TeamOutlined',
          status: 'active',
        },
        {
          label: '菜单管理',
          path: '/menus',
          order: 4,
          icon: 'MenuOutlined',
          status: 'active',
        },
        {
          label: '系统设置',
          path: '/settings',
          order: 5,
          icon: 'SettingOutlined',
          status: 'active',
        },
      ]

      // 批量创建默认菜单
      const createdMenus = await this.insertMany(defaultMenus)
      
      // 更新 key 字段为实际的 _id
      for (const menu of createdMenus) {
        menu.key = menu._id.toString()
        await menu.save()
      }
      
      console.log('默认菜单初始化完成')
    }
  } catch (error) {
    console.error('初始化默认菜单失败:', error)
  }
}

// 检查模型是否已经存在
const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema)

export default Menu
