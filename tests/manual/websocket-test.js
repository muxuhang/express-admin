let ws = null
const messageContainer = document.getElementById('messageContainer')
const connectBtn = document.getElementById('connectBtn')
const disconnectBtn = document.getElementById('disconnectBtn')
const pingBtn = document.getElementById('pingBtn')
const sendBtn = document.getElementById('sendBtn')
const messageInput = document.getElementById('messageInput')

// 添加消息到容器
function addMessage(message, type = 'system') {
  const div = document.createElement('div')
  div.className = `message ${type}`
  div.textContent = message
  messageContainer.appendChild(div)
  messageContainer.scrollTop = messageContainer.scrollHeight
}

// 连接 WebSocket
function connect() {
  ws = new WebSocket(`ws://${window.location.host}`)
  console.log(`ws://${window.location.host}`)
  ws.onopen = () => {
    addMessage('连接成功', 'success')
    connectBtn.disabled = true
    disconnectBtn.disabled = false
    pingBtn.disabled = false
    sendBtn.disabled = false
  }

  ws.onclose = () => {
    addMessage('连接已关闭', 'system')
    connectBtn.disabled = false
    disconnectBtn.disabled = true
    pingBtn.disabled = true
    sendBtn.disabled = true
  }

  ws.onerror = (error) => {
    addMessage('连接错误: ' + error.message, 'error')
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'welcome':
          addMessage(`连接成功，客户端ID: ${data.clientId}`, 'success')
          break
        case 'pong':
          addMessage('收到 Pong 响应', 'system')
          break
        case 'broadcast':
          addMessage(`广播消息: ${data.message} (来自: ${data.from})`, 'system')
          break
        case 'error':
          addMessage(`错误: ${data.message}`, 'error')
          break
        default:
          addMessage(`收到消息: ${event.data}`, 'system')
      }
    } catch (error) {
      addMessage(`消息解析错误: ${error.message}`, 'error')
    }
  }
}

// 断开连接
function disconnect() {
  if (ws) {
    ws.close()
    ws = null
  }
}

// 发送 Ping
function sendPing() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }))
    addMessage('发送 Ping', 'system')
  }
}

// 发送广播消息
function sendBroadcast() {
  const message = messageInput.value.trim()
  if (!message) {
    addMessage('请输入消息内容', 'error')
    return
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'broadcast',
        message: message,
      })
    )
    messageInput.value = ''
    addMessage('发送广播消息', 'system')
  }
}

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
  connectBtn.addEventListener('click', connect)
  disconnectBtn.addEventListener('click', disconnect)
  pingBtn.addEventListener('click', sendPing)
  sendBtn.addEventListener('click', sendBroadcast)
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendBroadcast()
    }
  })
})
