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
    maxPoolSize: 10,
    minPoolSize: 5,
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
const MAX_RETRIES = 3
const RETRY_INTERVAL = 5000
let retryCount = 0
let isConnecting = false

// 监控连接状态
const connectionState = {
  isConnected: false,
  lastError: null,
  lastConnectionAttempt: null,
  connectionAttempts: 0,
}

// 连接函数
const connectWithRetry = async () => {
  if (isConnecting) {
    console.log('已有连接尝试正在进行中...')
    return
  }

  isConnecting = true
  connectionState.lastConnectionAttempt = new Date()
  connectionState.connectionAttempts++

  try {
    console.log(`连接数据库... (${retryCount + 1}/${MAX_RETRIES})`)

    await mongoose.connect(MONGODB_CONFIG.url, {
      ...MONGODB_CONFIG.options,
      user: MONGODB_CONFIG.username,
      pass: MONGODB_CONFIG.password,
    })

    connectionState.isConnected = true
    connectionState.lastError = null
    console.log('数据库连接成功')
    const port = process.env.PORT || 3000
    console.log(`接口地址: http://localhost:${port}`)

    // 重置重试计数
    retryCount = 0
  } catch (error) {
    connectionState.lastError = error
    console.error('MongoDB 连接错误:', error.message)

    if (retryCount < MAX_RETRIES - 1) {
      retryCount++
      console.log(`${RETRY_INTERVAL / 1000}秒后重试...`)
      setTimeout(connectWithRetry, RETRY_INTERVAL)
    } else {
      console.error('达到最大重试次数，退出程序')
      process.exit(1)
    }
  } finally {
    isConnecting = false
  }
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
  console.log('MongoDB 连接已建立')
})

db.on('disconnected', () => {
  connectionState.isConnected = false
  console.log('MongoDB 连接已断开')
  // 如果不是主动断开，尝试重连
  if (!connectionState.isConnecting) {
    connectWithRetry()
  }
})

db.on('error', (error) => {
  connectionState.lastError = error
  console.error('MongoDB 错误:', error)
})

// 优雅关闭
const gracefulShutdown = async (signal) => {
  console.log(`收到 ${signal} 信号，准备关闭数据库连接...`)
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
  gracefulShutdown('uncaughtException')
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
  gracefulShutdown('unhandledRejection')
})

// 启动连接
connectWithRetry()

// 导出 mongoose 实例和连接状态
export { connectionState }
export default mongoose
