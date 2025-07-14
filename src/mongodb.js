import mongoose from 'mongoose'
import { configDotenv } from 'dotenv'

configDotenv()

// MongoDB 配置
const MONGODB_CONFIG = {
  url: process.env.MONGODB_URI,
  username: process.env.MONGODB_USER,
  password: process.env.MONGODB_PASSWORD,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 1,
    retryWrites: true,
    retryReads: true,
    heartbeatFrequencyMS: 2000,
    autoIndex: process.env.NODE_ENV !== 'production',
    family: 4, // 强制使用 IPv4
    compressors: 'zlib',
    zlibCompressionLevel: 9,
  },
}

// 验证必要的配置
if (!MONGODB_CONFIG.url) {
  console.error('错误: MongoDB URL 未配置')
  process.exit(1)
}

// 设置 strictQuery 为 false 以准备 Mongoose 7 的变更
mongoose.set('strictQuery', false)

// 连接重试配置
const MAX_RETRIES = 300
const RETRY_INTERVAL = 5000
let retryCount = 0
let isConnecting = false
let isShuttingDown = false

// 监控连接状态
const connectionState = {
  isConnected: false,
  isConnecting: false,
  lastError: null,
  lastConnectionAttempt: null,
  connectionAttempts: 0,
  isShuttingDown: false,
}

// 连接Promise
let connectionPromise = null

// 连接函数
const connectWithRetry = async () => {
  // 如果正在关闭，不进行连接
  if (isShuttingDown || connectionState.isShuttingDown) {
    console.log('系统正在关闭，跳过数据库连接')
    return
  }

  // 如果已经连接，直接返回
  if (mongoose.connection.readyState === 1) {
    console.log('数据库已经连接')
    return
  }

  if (isConnecting) {
    console.log('已有连接尝试正在进行中...')
    return connectionPromise
  }

  if (connectionPromise) {
    return connectionPromise
  }

  isConnecting = true
  connectionState.isConnecting = true
  connectionState.lastConnectionAttempt = new Date()
  connectionState.connectionAttempts++

  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      console.log(`连接数据库... (${retryCount + 1}/${MAX_RETRIES})`)

      await mongoose.connect(MONGODB_CONFIG.url, {
        ...MONGODB_CONFIG.options,
      })

      // 等待连接完全建立
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve()
        } else {
          mongoose.connection.once('connected', resolve)
        }
      })

      connectionState.isConnected = true
      connectionState.isConnecting = false
      connectionState.lastError = null
      console.log('数据库连接成功')
      const port = process.env.PORT || 8888
      console.log(`接口地址: http://localhost:${port}`)
      
      // 重置重试计数
      retryCount = 0
      resolve()
    } catch (error) {
      connectionState.lastError = error
      connectionState.isConnecting = false
      console.error('MongoDB 连接错误:', error.message)

      if (retryCount < MAX_RETRIES - 1) {
        retryCount++
        console.log(`${RETRY_INTERVAL / 1000}秒后重试...`)
        setTimeout(async () => {
          try {
            await connectWithRetry()
            resolve()
          } catch (retryError) {
            reject(retryError)
          }
        }, RETRY_INTERVAL)
      } else {
        console.error('达到最大重试次数，退出程序')
        reject(error)
      }
    } finally {
      isConnecting = false
    }
  })

  return connectionPromise
}

// 设置 Promise
mongoose.Promise = global.Promise

// 连接事件处理
const db = mongoose.connection

// 监控连接状态
const monitorConnection = () => {
  const state = mongoose.connection.readyState
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  console.log(`MongoDB 连接状态: ${states[state]}`)
}

// 定期监控连接状态
setInterval(monitorConnection, 30000)

db.on('connected', () => {
  connectionState.isConnected = true
  connectionState.isConnecting = false
  console.log('MongoDB 连接已建立')
})

db.on('disconnected', () => {
  connectionState.isConnected = false
  connectionState.isConnecting = false
  console.log('MongoDB 连接已断开')
  
  // 重置连接Promise，允许重新连接
  connectionPromise = null
  
  // 如果不是主动断开且不在关闭过程中，尝试重连
  if (!isShuttingDown && !connectionState.isShuttingDown) {
    console.log('尝试重新连接数据库...')
    setTimeout(() => {
      connectWithRetry().catch(error => {
        console.error('重连失败:', error.message)
      })
    }, 1000)
  }
})

db.on('error', (error) => {
  connectionState.lastError = error
  console.error('MongoDB 错误:', error)
})

// 优雅关闭
const gracefulShutdown = async (signal) => {
  console.log(`收到 ${signal} 信号，准备关闭数据库连接...`)
  isShuttingDown = true
  connectionState.isShuttingDown = true
  
  try {
    await mongoose.connection.close()
    console.log('MongoDB 连接已安全关闭')
    process.exit(0)
  } catch (error) {
    console.error('关闭 MongoDB 连接时出错:', error)
    process.exit(1)
  }
}

// 处理各种终止信号
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'))

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  // 只有在非连接相关错误时才关闭
  if (!error.message.includes('connection') && !error.message.includes('MongoDB')) {
    gracefulShutdown('uncaughtException')
  }
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
  // 只有在非连接相关错误时才关闭
  if (!reason.message?.includes('connection') && !reason.message?.includes('MongoDB')) {
    gracefulShutdown('unhandledRejection')
  }
})

// 导出 mongoose 实例、连接状态和连接Promise
export { connectionState, connectWithRetry }
export default mongoose
