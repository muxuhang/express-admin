import { WebSocketServer } from 'ws'

class WebSocketService {
  constructor() {
    this.wss = null
    this.clients = new Map() // 存储所有连接的客户端
  }

  // 初始化 WebSocket 服务
  initialize(server) {
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', (ws, req) => {
      try {
        // 生成一个随机的客户端ID
        const clientId = Math.random().toString(36).substring(7)

        // 存储客户端连接
        this.clients.set(clientId, {
          ws,
          id: clientId,
        })

        // 处理消息
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message)
            this.handleMessage(ws, data, clientId)
          } catch (error) {
            console.error('消息处理错误:', error)
            this.sendToClient(ws, {
              type: 'error',
              message: '消息格式错误',
            })
          }
        })

        // 处理连接关闭
        ws.on('close', () => {
          this.clients.delete(clientId)
          console.log(`客户端 ${clientId} 断开连接`)
        })

        // 处理错误
        ws.on('error', (error) => {
          console.error('WebSocket 错误:', error)
          this.clients.delete(clientId)
        })
      } catch (error) {
        console.error('WebSocket 连接错误:', error)
        ws.close(1011, '服务器错误')
      }
    })
  }

  // 处理接收到的消息
  handleMessage(ws, data, clientId) {
    switch (data.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong' })
        break
      case 'broadcast':
        if (data.message) {
          this.broadcast({
            type: 'broadcast',
            message: data.message,
            from: clientId,
          })
        }
        break
      default:
        this.sendToClient(ws, {
          type: 'error',
          message: '未知的消息类型',
        })
    }
  }

  // 发送消息给指定客户端
  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  // 发送消息给指定客户端ID
  sendToClientId(clientId, data) {
    const client = this.clients.get(clientId)
    if (client) {
      this.sendToClient(client.ws, data)
    }
  }

  // 广播消息给所有客户端
  broadcast(data) {
    this.clients.forEach((client) => {
      this.sendToClient(client.ws, data)
    })
  }

  // 获取在线客户端列表
  getOnlineClients() {
    return Array.from(this.clients.keys())
  }
}

// 创建单例实例
const websocketService = new WebSocketService()

export default websocketService
