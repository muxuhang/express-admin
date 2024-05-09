import mongoose from 'mongoose'
import { configDotenv } from 'dotenv'

configDotenv()
const url = process.env.MONGODB_URI
const username = process.env.USERNAME
const passwork = process.env.PASSWORD

if (!url) {
  console.log('MongoDB URL 未配置')
  process.exit(1)
}

console.log('数据库连接中')

mongoose.connect(url, {
  user: username,
  pass: passwork,
})

mongoose.Promise = global.Promise

const db = mongoose.connection

db.on('connected', function () {
  console.log('数据库连接成功')
})

// 错误处理
db.on('error', (error) => {
  console.error('MongoDB 连接错误：', error)
  // 根据错误类型，可以考虑实现错误重试逻辑等
})
// 超时处理（示例，根据实际需要调整）
const timeout = setTimeout(() => {
  console.error('连接 MongoDB 超时')
  process.exit(1)
}, 20000) // 假设 20 秒超时

// 当连接成功时清除超时计时器
db.once('open', function () {
  clearTimeout(timeout)
})
