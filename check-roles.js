import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Role from './src/models/role.js'

// 加载环境变量
dotenv.config()

const checkRoles = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('数据库连接成功')

    // 查询所有角色
    const roles = await Role.find({})
    console.log('数据库中的所有角色:')
    console.log(JSON.stringify(roles, null, 2))

    // 特别查询 admin 角色
    const adminRole = await Role.findOne({ code: 'admin' })
    console.log('\nadmin 角色详情:')
    console.log(adminRole ? JSON.stringify(adminRole, null, 2) : 'admin 角色不存在')

    // 查询启用状态的角色
    const activeRoles = await Role.find({ status: 'active' })
    console.log('\n启用状态的角色:')
    console.log(JSON.stringify(activeRoles, null, 2))

  } catch (error) {
    console.error('检查角色失败:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkRoles() 