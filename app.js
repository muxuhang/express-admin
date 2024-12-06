import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import bodyParser from 'body-parser'
import cors from 'cors'
import { configDotenv } from 'dotenv'
import ejs from 'ejs'
import './mongodb'
import './utils/schema'

// 环境配置
configDotenv()
var app = express()

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

// 路由配置
const routerList = require('./routes/index')
routerList.map((item) => {
  app.use('/', item)
})

// 明确指定静态文件目录
app.use(express.static(path.join(__dirname, 'views'), { maxAge: 31536000 }))
app.use(cors())

// 捕获所有未找到的路由，并返回 Vue 应用程序的入口文件
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, 'views', 'index.html'))
})

// 错误处理
app.use(function (err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  console.error('------Error begin------')
  console.error(err.status, err)
  console.error('------Error end------')
  res.status(err.status || 500).render('error') // 使用通用错误页面模板
})

module.exports = app
