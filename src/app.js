import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import bodyParser from 'body-parser'
import cors from 'cors'
import ejs from 'ejs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import './mongodb.js'
import routerList from './routes/index.js'
import { AppError } from './utils/handleError.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import Menu from './models/menu.js'
import pusherService from './services/pusher.js'

// 兼容 Jest、Babel、Node 原生环境的 __filename/__dirname
let __filename, __dirname

// 检查是否在测试环境中
if (process.env.NODE_ENV === 'test' || typeof import.meta === 'undefined') {
  // Jest 或 Babel 环境
  __filename = path.resolve(process.cwd(), 'src/app.js')
  __dirname = path.resolve(process.cwd(), 'src')
} else {
  // Node 原生 ESM 环境
  __filename = fileURLToPath(import.meta.url)
  __dirname = dirname(__filename)
}

dotenv.config()

var app = express()

// 初始化默认菜单
const initDefaultMenus = async () => {
  try {
    await Menu.initDefaultMenus()
  } catch (error) {
    console.error('初始化默认菜单失败:', error)
  }
}

// 应用启动时初始化
const initializeApp = async () => {
  await initDefaultMenus()
  
  // 启动推送任务调度器
  startPushTaskScheduler()
}

// 启动推送任务调度器
const startPushTaskScheduler = () => {
  console.log('🚀 启动推送任务调度器...')
  
  // 每30秒检查一次定时任务和循环任务
  const schedulerInterval = setInterval(async () => {
    try {
      // 执行定时任务
      await pusherService.executeScheduledTasks()
      
      // 执行循环任务
      await pusherService.executeRecurringTasks()
    } catch (error) {
      console.error('执行推送任务失败:', error)
    }
  }, 30000) // 30秒检查一次
  
  // 应用关闭时清理定时器
  process.on('SIGINT', () => {
    clearInterval(schedulerInterval)
    console.log('推送任务调度器已停止')
  })
  
  process.on('SIGTERM', () => {
    clearInterval(schedulerInterval)
    console.log('推送任务调度器已停止')
  })
  
  console.log('✅ 推送任务调度器启动成功，每30秒检查一次任务')
}

// 执行初始化
initializeApp()

// 安全相关中间件
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
)
app.use(cors()) // 配置 CORS

// 限制请求速率
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
})
app.use(limiter)

// 视图配置
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')
app.engine('html', ejs.renderFile)

// 中间件配置
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

// 明确指定静态文件目录
app.use(
  express.static(path.join(__dirname, 'views'), {
    maxAge: 31536000,
    etag: true,
    lastModified: true,
  })
)

// 添加 public 目录的静态文件配置
app.use(express.static(path.join(__dirname, '../public')))

// API 路由配置
routerList.forEach((router) => {
  app.use('/', router)
})

// 404 错误处理
app.use((req, res, next) => {
  next(new AppError(404, '请求的资源不存在'))
})

// 捕获所有未找到的路由，并返回 Vue 应用程序的入口文件
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'views', 'index.html'))
})

// 优雅关闭处理
let server
const gracefulShutdown = async (signal) => {
  console.log(`收到 ${signal} 信号，准备关闭服务器...`)

  if (server) {
    server.close(() => {
      console.log('HTTP 服务器已关闭')
      process.exit(0)
    })

    // 如果 10 秒后还没有关闭，强制退出
    setTimeout(() => {
      console.error('无法正常关闭服务器，强制退出')
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
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

// 导出 app 和 server 设置函数
export const setServer = (httpServer) => {
  server = httpServer
}

export default app
