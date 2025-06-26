import mongoose from 'mongoose'
import User from '../models/user.js'
import Role from '../models/role.js'
import Menu from '../models/menu.js'
import bcrypt from 'bcryptjs'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`MongoDB 连接成功: ${conn.connection.host}`)

    // 初始化默认数据
    await initDefaultData()

  } catch (error) {
    console.error('MongoDB 连接失败:', error)
    process.exit(1)
  }
}

// 初始化默认数据
const initDefaultData = async () => {
  try {
    console.log('开始初始化默认数据...')

    // 初始化默认角色
    await Role.initDefaultRoles()

    // 初始化默认菜单
    await Menu.initDefaultMenus()

    // 检查是否已存在管理员用户
    const adminUser = await User.findOne({ username: 'admin' })
    if (!adminUser) {
      // 创建默认管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        phone: '13800138000',
        role: 'admin',
        status: 'active'
      })
      console.log('默认管理员用户创建成功')
      console.log('用户名: admin')
      console.log('密码: admin123')
      console.log('手机号: 13800138000')
    }

    console.log('默认数据初始化完成')
  } catch (error) {
    console.error('初始化默认数据失败:', error)
  }
}

export default connectDB 