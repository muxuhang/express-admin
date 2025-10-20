/**
 * 初始化默认菜单脚本
 *
 * 用途：
 * - 当需要手动初始化（或在空库中首次导入）默认菜单时执行
 * - 如果当前菜单集合已有数据，将不会重复创建
 *
 * 使用：
 *   npm run init-menus
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Menu from '../src/models/menu.js'

// 加载环境变量
dotenv.config()

async function initMenus() {
  try {
    const { MONGODB_URI, MONGODB_USER, MONGODB_PASSWORD } = process.env

    if (!MONGODB_URI) {
      console.error('请在 .env 中配置 MONGODB_URI')
      process.exit(1)
    }

    // 兼容需要用户/密码与无需用户/密码两种模式
    if (MONGODB_USER || MONGODB_PASSWORD) {
      await mongoose.connect(MONGODB_URI, { user: MONGODB_USER, pass: MONGODB_PASSWORD })
    } else {
      await mongoose.connect(MONGODB_URI)
    }

    const force = process.argv.includes('--force')

    if (force) {
      const del = await Menu.deleteMany({})
      console.log(`已清空菜单集合，删除 ${del.deletedCount} 条记录。`)
    }

    const count = await Menu.countDocuments()
    if (count > 0) {
      console.log(`已存在 ${count} 条菜单数据，跳过默认菜单初始化（可使用 --force 强制重置）。`)
      process.exit(0)
    }

    await Menu.initDefaultMenus()

    const allMenus = await Menu.find().sort({ order: 1, createdAt: -1 })
    console.log('默认菜单初始化成功：')
    console.table(allMenus.map(m => ({ label: m.label, path: m.path, order: m.order, icon: m.icon, status: m.status })))
  } catch (error) {
    console.error('初始化默认菜单失败：', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

initMenus()


