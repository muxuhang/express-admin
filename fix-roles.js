import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Role from './src/models/role.js'

// 加载环境变量
dotenv.config()

const fixRoles = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('数据库连接成功')

    // 查找并修复 admin 角色
    const adminRole = await Role.findOne({ code: 'admin' })
    if (adminRole) {
      console.log('找到 admin 角色，检查并修复数据...')
      
      // 确保状态字段正确
      if (adminRole.status !== 'active') {
        adminRole.status = 'active'
        console.log('修复 admin 角色状态为 active')
      }
      
      // 确保 isSystem 字段正确
      if (!adminRole.isSystem) {
        adminRole.isSystem = true
        console.log('修复 admin 角色 isSystem 为 true')
      }
      
      await adminRole.save()
      console.log('admin 角色修复完成')
    } else {
      console.log('admin 角色不存在，创建新的 admin 角色...')
      await Role.create({
        name: '管理员',
        code: 'admin',
        description: '系统管理员，拥有所有权限',
        permissions: ['*'],
        status: 'active',
        isSystem: true
      })
      console.log('admin 角色创建成功')
    }

    // 查找并修复 user 角色
    const userRole = await Role.findOne({ code: 'user' })
    if (userRole) {
      console.log('找到 user 角色，检查并修复数据...')
      
      // 确保状态字段正确
      if (userRole.status !== 'active') {
        userRole.status = 'active'
        console.log('修复 user 角色状态为 active')
      }
      
      // 确保 isSystem 字段正确
      if (!userRole.isSystem) {
        userRole.isSystem = true
        console.log('修复 user 角色 isSystem 为 true')
      }
      
      await userRole.save()
      console.log('user 角色修复完成')
    } else {
      console.log('user 角色不存在，创建新的 user 角色...')
      await Role.create({
        name: '普通用户',
        code: 'user',
        description: '普通用户，拥有基本权限',
        permissions: ['view_profile', 'edit_profile'],
        status: 'active',
        isSystem: true
      })
      console.log('user 角色创建成功')
    }

    // 验证修复结果
    console.log('\n验证修复结果:')
    const allRoles = await Role.find({})
    console.log('所有角色:', JSON.stringify(allRoles.map(r => ({ code: r.code, status: r.status, isSystem: r.isSystem })), null, 2))
    
    const activeRoles = await Role.find({ status: 'active' })
    console.log('启用状态的角色数量:', activeRoles.length)

  } catch (error) {
    console.error('修复角色失败:', error)
  } finally {
    await mongoose.disconnect()
  }
}

fixRoles() 