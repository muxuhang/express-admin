import Role from "../models/role"

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
        is_system: true,
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
        is_system: true,
      })
      console.log('普通用户角色创建成功')
    }
  } catch (error) {
    console.error('初始化默认角色失败:', error)
  }
}

export default initDefaultRoles
