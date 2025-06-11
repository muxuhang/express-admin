let pusher = null
let channel = null
const messageContainer = document.getElementById('messageContainer')
const connectBtn = document.getElementById('connectBtn')
const disconnectBtn = document.getElementById('disconnectBtn')
const sendBtn = document.getElementById('sendBtn')
const messageInput = document.getElementById('messageInput')

const process = {
  key: '4e0ed1e3365085e2836d',
  cluster: 'mt1',
}
// 添加消息到容器
function addMessage(message, type = 'system') {
  const div = document.createElement('div')
  div.className = `message ${type}`
  div.textContent = message
  messageContainer.appendChild(div)
  messageContainer.scrollTop = messageContainer.scrollHeight
}
// 连接 Pusher
function connect() {
  try {
    const Pusher = window.Pusher
    // 创建 Pusher 实例
    pusher = new Pusher(process.key, {
      cluster: process.cluster,
      encrypted: true,
    })

    // 订阅频道
    channel = pusher.subscribe('my-channel')

    // 监听连接事件
    pusher.connection.bind('connected', () => {
      addMessage('连接成功', 'success')
      connectBtn.disabled = true
      disconnectBtn.disabled = false
      sendBtn.disabled = false
    })

    // 监听断开连接事件
    pusher.connection.bind('disconnected', () => {
      addMessage('连接已断开', 'system')
      connectBtn.disabled = false
      disconnectBtn.disabled = true
      sendBtn.disabled = true
    })

    // 监听错误事件
    pusher.connection.bind('error', (error) => {
      console.log(2, 'error')
      addMessage('连接错误: ' + error.message, 'error')
    })

    // 监听消息事件
    channel.bind('my-event', (data) => {
      addMessage(`收到消息: ${data.message} (来自: ${data.from})`, 'system')
    })
  } catch (error) {
    console.log(1, 'error',error)
    addMessage('连接错误: ' + error.message, 'error')
  }
}

// 断开连接
function disconnect() {
  if (channel) {
    channel.unbind_all()
    channel.unsubscribe()
    channel = null
  }
  if (pusher) {
    pusher.disconnect()
    pusher = null
  }
  addMessage('已断开连接', 'system')
  connectBtn.disabled = false
  disconnectBtn.disabled = true
  sendBtn.disabled = true
}

// 发送消息
function sendMessage() {
  const message = messageInput.value.trim()
  if (!message) {
    addMessage('请输入消息内容', 'error')
    return
  }

  // 发送消息到服务器
  fetch('/api/pusher/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      channel: 'my-channel',
      event: 'my-event',
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.code === 0) {
        messageInput.value = ''
        addMessage('消息已发送', 'success')
      } else {
        addMessage('发送失败: ' + data.message, 'error')
      }
    })
    .catch((error) => {
      addMessage('发送错误: ' + error.message, 'error')
    })
}

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
  connectBtn.addEventListener('click', connect)
  disconnectBtn.addEventListener('click', disconnect)
  sendBtn.addEventListener('click', sendMessage)
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  })
})
