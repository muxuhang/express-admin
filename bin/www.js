#!/usr/bin/env node

/**
 * Module dependencies.
 */

import http from 'http'
import debug from 'debug'
import app, { setServer } from '../src/app.js'
import websocketService from '../src/services/websocket.js'
import { connectWithRetry, connectionState } from '../src/mongodb.js'
import { initDefaultRoles } from '../src/models/role.js'
import { fetch, Headers, Request, Response } from 'undici';

globalThis.fetch = fetch
globalThis.Headers = Headers
globalThis.Request = Request
globalThis.Response = Response

const debugServer = debug('express-admin:server')

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3002')
app.set('port', port)

// 声明全局server变量
let server

/**
 * 启动服务器的函数
 */
const startServer = async () => {
  try {
    // 等待数据库连接
    console.log('等待数据库连接...')
    await connectWithRetry()
    console.log('数据库连接成功，启动服务器...')

    // 初始化角色
    await initDefaultRoles()

    /**
     * Create HTTP server.
     */
    server = http.createServer(app)

    // 初始化 WebSocket 服务
    websocketService.initialize(server)

    // 设置 server 实例到 app 中
    setServer(server)

    /**
     * Listen on provided port, on all network interfaces.
     */
    server.listen(port)
    server.on('error', onError)
    server.on('listening', onListening)

  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debugServer('Listening on ' + bind)
  console.log(`服务器启动成功，监听端口: ${port}`)
}

// 启动服务器
startServer()
