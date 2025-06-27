import 'regenerator-runtime/runtime'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// 加载测试环境变量
dotenv.config({ path: '.env.test' })

// 设置测试环境
process.env.NODE_ENV = 'test'

// 全局测试超时
jest.setTimeout(10000)

// 全局测试前设置
beforeAll(async () => {
  try {
    // 连接测试数据库
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/express-admin-test')
      console.log('✅ 测试数据库连接成功')
    }
  } catch (error) {
    console.warn('⚠️  测试数据库连接失败，跳过数据库相关测试:', error.message)
  }
})

// 全局测试后清理
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // 清理测试数据库 - 只清理集合，不删除数据库
      const collections = mongoose.connection.collections
      for (const key in collections) {
        const collection = collections[key]
        await collection.deleteMany({})
      }
      await mongoose.connection.close()
      console.log('✅ 测试数据库清理完成')
    }
  } catch (error) {
    console.warn('⚠️  测试数据库清理失败:', error.message)
  }
})

// 每个测试前清理
beforeEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // 清理所有集合
      const collections = mongoose.connection.collections
      for (const key in collections) {
        const collection = collections[key]
        await collection.deleteMany({})
      }
    }
  } catch (error) {
    console.warn('⚠️  测试前清理失败:', error.message)
  }
})

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
}) 