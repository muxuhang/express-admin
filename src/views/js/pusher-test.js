let pusher = null
let systemChannel = null
let userChannel = null

// DOM 元素变量声明
let messageContainer, connectBtn, disconnectBtn, clearBtn, userIdInput, connectionStatus
let pushTitle, pushContent, pushDescription, pushType, pushMode, targetType
let sendPushBtn, testSimplePushBtn, testSuccessNotificationBtn
let loadTasksBtn, refreshTasksBtn, taskList
let loadStatsBtn, statsContainer

const process = {
  key: '4e0ed1e3365085e2836d',
  cluster: 'mt1',
}

// 获取cookie值的辅助函数
function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

// 安全地设置元素属性
function safeSetDisabled(element, disabled) {
  if (element) {
    element.disabled = disabled
  }
}

// 安全地设置元素显示
function safeSetDisplay(elementId, display) {
  const element = document.getElementById(elementId)
  if (element) {
    element.style.display = display
  }
}

// 添加消息到容器
function addMessage(message, type = 'system') {
  if (!messageContainer) {
    console.error('消息容器未找到:', message)
    return
  }

  const div = document.createElement('div')
  div.className = `message ${type}`
  const timestamp = new Date().toLocaleTimeString()
  div.innerHTML = `<strong>[${timestamp}]</strong> ${message}`
  messageContainer.appendChild(div)
  messageContainer.scrollTop = messageContainer.scrollHeight
}

// 更新连接状态
function updateConnectionStatus(status, text) {
  if (!connectionStatus) {
    console.error('连接状态元素未找到')
    return
  }

  connectionStatus.className = `status ${status}`
  connectionStatus.textContent = text
}

// 切换标签页
function switchTab(tabName) {
  // 隐藏所有标签页内容
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active')
  })
  
  // 移除所有标签页的active类
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active')
  })
  
  // 显示选中的标签页
  const targetTab = document.getElementById(`${tabName}-tab`)
  if (targetTab) {
    targetTab.classList.add('active')
  }
  
  // 激活对应的标签按钮
  if (event && event.target) {
    event.target.classList.add('active')
  }
}

// 切换推送方式相关字段
function togglePushModeFields() {
  if (!pushMode) {
    console.error('推送方式选择器未找到')
    return
  }

  const mode = pushMode.value
  
  // 隐藏所有配置区域
  safeSetDisplay('scheduledConfig', 'none')
  safeSetDisplay('recurringConfig', 'none')
  
  // 显示对应的配置区域
  if (mode === 'scheduled') {
    safeSetDisplay('scheduledConfig', 'block')
    // 设置最小时间为当前时间后1分钟
    const minTime = new Date(Date.now() + 60000).toISOString().slice(0, 16)
    const scheduledTimeElement = document.getElementById('scheduledTime')
    if (scheduledTimeElement) {
      scheduledTimeElement.min = minTime
    }
  } else if (mode === 'recurring') {
    safeSetDisplay('recurringConfig', 'block')
  }
}

// 切换目标类型相关字段
function toggleTargetFields() {
  if (!targetType) {
    console.error('目标类型选择器未找到')
    return
  }

  const target = targetType.value
  
  // 隐藏所有目标配置区域
  safeSetDisplay('specificTargetConfig', 'none')
  safeSetDisplay('roleTargetConfig', 'none')
  
  // 显示对应的配置区域
  if (target === 'specific') {
    safeSetDisplay('specificTargetConfig', 'block')
  } else if (target === 'role') {
    safeSetDisplay('roleTargetConfig', 'block')
  }
}

// 切换循环推送相关字段
function toggleRecurringFields() {
  const recurringTypeElement = document.getElementById('recurringType')
  if (!recurringTypeElement) {
    console.error('循环类型选择器未找到')
    return
  }

  const recurringType = recurringTypeElement.value
  
  // 隐藏所有循环配置区域
  safeSetDisplay('intervalConfig', 'none')
  safeSetDisplay('dailyConfig', 'none')
  
  // 显示对应的配置区域
  if (recurringType === 'interval') {
    safeSetDisplay('intervalConfig', 'block')
  } else if (recurringType === 'daily') {
    safeSetDisplay('dailyConfig', 'block')
  }
}

// 切换成功通知相关字段
function toggleSuccessNotificationFields() {
  const notifyOnSuccessElement = document.getElementById('notifyOnSuccess')
  if (!notifyOnSuccessElement) {
    console.error('成功通知复选框未找到')
    return
  }

  const notifyOnSuccess = notifyOnSuccessElement.checked
  safeSetDisplay('successNotificationConfig', notifyOnSuccess ? 'block' : 'none')
}

// 连接 Pusher
function connect() {
  try {
    if (!userIdInput) {
      addMessage('用户ID输入框未找到', 'error')
      return
    }

    const userId = userIdInput.value.trim()
    if (!userId) {
      addMessage('请输入用户ID', 'error')
      return
    }

    const Pusher = window.Pusher
    if (!Pusher) {
      addMessage('Pusher 库未加载', 'error')
      return
    }

    updateConnectionStatus('connecting', '连接中...')
    
    // 创建 Pusher 实例
    pusher = new Pusher(process.key, {
      cluster: process.cluster,
      encrypted: true,
    })

    // 订阅系统通知频道
    systemChannel = pusher.subscribe('system-notifications')

    // 订阅用户私有频道（用于接收成功通知）
    userChannel = pusher.subscribe(`private-user-${userId}`)

    // 监听连接事件
    pusher.connection.bind('connected', () => {
      addMessage('Pusher 连接成功', 'success')
      updateConnectionStatus('connected', '已连接')
      safeSetDisabled(connectBtn, true)
      safeSetDisabled(disconnectBtn, false)
      safeSetDisabled(sendPushBtn, false)
      safeSetDisabled(testSimplePushBtn, false)
      safeSetDisabled(testSuccessNotificationBtn, false)
      safeSetDisabled(loadTasksBtn, false)
      safeSetDisabled(loadStatsBtn, false)
    })

    // 监听断开连接事件
    pusher.connection.bind('disconnected', () => {
      addMessage('Pusher 连接已断开', 'warning')
      updateConnectionStatus('disconnected', '未连接')
      safeSetDisabled(connectBtn, false)
      safeSetDisabled(disconnectBtn, true)
      safeSetDisabled(sendPushBtn, true)
      safeSetDisabled(testSimplePushBtn, true)
      safeSetDisabled(testSuccessNotificationBtn, true)
      safeSetDisabled(loadTasksBtn, true)
      safeSetDisabled(loadStatsBtn, true)
    })

    // 监听错误事件
    pusher.connection.bind('error', (error) => {
      console.log('连接错误:', error)
      addMessage('连接错误: ' + error.message, 'error')
      updateConnectionStatus('disconnected', '连接错误')
    })

    // 监听系统通知频道的推送消息
    systemChannel.bind('notification', (data) => {
      addMessage(`收到推送通知: ${data.title} - ${data.content}`, 'system')
      console.log('推送通知数据:', data)
    })

    // 监听系统通知频道的成功通知
    systemChannel.bind('success_notification', (data) => {
      addMessage(`收到系统成功通知: ${data.message}`, 'success')
      console.log('系统成功通知数据:', data)
    })

    // 监听用户私有频道的成功通知
    userChannel.bind('success_notification', (data) => {
      addMessage(`收到个人成功通知: ${data.title} - ${data.content}`, 'success')
      console.log('个人成功通知数据:', data)
    })

    // 监听订阅成功事件
    systemChannel.bind('pusher:subscription_succeeded', () => {
      addMessage('系统通知频道订阅成功', 'success')
    })

    userChannel.bind('pusher:subscription_succeeded', () => {
      addMessage(`用户私有频道订阅成功: private-user-${userId}`, 'success')
    })

    // 监听订阅错误事件
    systemChannel.bind('pusher:subscription_error', (error) => {
      addMessage('系统通知频道订阅失败: ' + error.message, 'error')
    })

    userChannel.bind('pusher:subscription_error', (error) => {
      addMessage('用户私有频道订阅失败: ' + error.message, 'error')
    })

  } catch (error) {
    console.log('连接错误:', error)
    addMessage('连接错误: ' + error.message, 'error')
    updateConnectionStatus('disconnected', '连接失败')
  }
}

// 断开连接
function disconnect() {
  if (systemChannel) {
    systemChannel.unbind_all()
    systemChannel.unsubscribe()
    systemChannel = null
  }
  if (userChannel) {
    userChannel.unbind_all()
    userChannel.unsubscribe()
    userChannel = null
  }
  if (pusher) {
    pusher.disconnect()
    pusher = null
  }
  addMessage('已断开连接', 'warning')
  updateConnectionStatus('disconnected', '未连接')
  safeSetDisabled(connectBtn, false)
  safeSetDisabled(disconnectBtn, true)
  safeSetDisabled(sendPushBtn, true)
  safeSetDisabled(testSimplePushBtn, true)
  safeSetDisabled(testSuccessNotificationBtn, true)
  safeSetDisabled(loadTasksBtn, true)
  safeSetDisabled(loadStatsBtn, true)
}

// 清空消息
function clearMessages() {
  if (!messageContainer) {
    console.error('消息容器未找到')
    return
  }

  messageContainer.innerHTML = ''
  addMessage('消息已清空', 'system')
}

// 构建推送数据
function buildPushData() {
  // 安全检查DOM元素是否存在
  if (!pushTitle || !pushContent || !pushDescription || !pushType || !pushMode || !targetType) {
    throw new Error('页面元素未正确加载，请刷新页面重试')
  }

  const data = {
    title: pushTitle.value.trim(),
    content: pushContent.value.trim(),
    description: pushDescription.value.trim(),
    type: pushType.value,
    pushMode: pushMode.value,
    targetType: targetType.value,
    notifyOnSuccess: document.getElementById('notifyOnSuccess')?.checked || false,
  }

  // 验证必填字段
  if (!data.title || !data.content) {
    throw new Error('标题和内容为必填项')
  }

  // 根据推送方式添加配置
  if (data.pushMode === 'scheduled') {
    const scheduledTimeElement = document.getElementById('scheduledTime')
    if (!scheduledTimeElement) {
      throw new Error('定时推送时间选择器未找到')
    }
    const scheduledTime = scheduledTimeElement.value
    if (!scheduledTime) {
      throw new Error('定时推送必须设置推送时间')
    }
    data.scheduledTime = new Date(scheduledTime).toISOString()
  } else if (data.pushMode === 'recurring') {
    const recurringTypeElement = document.getElementById('recurringType')
    const executedCountElement = document.getElementById('executedCount')
    
    if (!recurringTypeElement || !executedCountElement) {
      throw new Error('循环推送配置元素未找到')
    }
    
    const recurringType = recurringTypeElement.value
    const executedCount = parseInt(executedCountElement.value)
    
    data.recurringConfig = {
      type: recurringType,
      executedCount: executedCount
    }
    
    if (recurringType === 'interval') {
      const intervalElement = document.getElementById('interval')
      const intervalUnitElement = document.getElementById('intervalUnit')
      
      if (!intervalElement || !intervalUnitElement) {
        throw new Error('间隔推送配置元素未找到')
      }
      
      const interval = parseInt(intervalElement.value)
      const intervalUnit = intervalUnitElement.value
      if (!interval) {
        throw new Error('间隔推送必须设置间隔时间')
      }
      data.recurringConfig.interval = interval
      data.recurringConfig.intervalUnit = intervalUnit
    } else if (recurringType === 'daily') {
      const dailyTimeElement = document.getElementById('dailyTime')
      if (!dailyTimeElement) {
        throw new Error('每日推送时间选择器未找到')
      }
      const dailyTime = dailyTimeElement.value
      if (!dailyTime) {
        throw new Error('每日推送必须设置推送时间')
      }
      data.recurringConfig.dailyTime = dailyTime
    }
  }

  // 根据目标类型添加配置
  if (data.targetType === 'specific') {
    const targetUserIdsElement = document.getElementById('targetUserIds')
    if (!targetUserIdsElement) {
      throw new Error('目标用户输入框未找到')
    }
    const targetUserIds = targetUserIdsElement.value.trim()
    if (!targetUserIds) {
      throw new Error('指定用户推送时必须选择目标用户')
    }
    data.targetUserIds = targetUserIds.split(',').map(id => id.trim())
  } else if (data.targetType === 'role') {
    const targetRoleIdsElement = document.getElementById('targetRoleIds')
    if (!targetRoleIdsElement) {
      throw new Error('目标角色输入框未找到')
    }
    const targetRoleIds = targetRoleIdsElement.value.trim()
    if (!targetRoleIds) {
      throw new Error('指定角色推送时必须选择目标角色')
    }
    data.targetRoleIds = targetRoleIds.split(',').map(id => id.trim())
  }

  // 添加成功通知配置
  if (data.notifyOnSuccess) {
    const successTitleElement = document.getElementById('successNotificationTitle')
    const successContentElement = document.getElementById('successNotificationContent')
    
    if (!successTitleElement || !successContentElement) {
      throw new Error('成功通知配置元素未找到')
    }
    
    const successTitle = successTitleElement.value.trim()
    const successContent = successContentElement.value.trim()
    if (!successTitle || !successContent) {
      throw new Error('启用成功通知时必须设置通知标题和内容')
    }
    data.successNotificationTitle = successTitle
    data.successNotificationContent = successContent
  }

  return data
}

// 发送推送
async function sendPush() {
  try {
    addMessage('正在发送推送...', 'system')
    
    const pushData = buildPushData()
    console.log('推送数据:', pushData)

    // 获取认证token（从localStorage或cookie中）
    const token = localStorage.getItem('token') || getCookie('token')
    
    const response = await fetch('/api/pusher/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(pushData)
    })

    const result = await response.json()
    
    if (result.code === 0) {
      addMessage(`推送发送成功: ${result.message}`, 'success')
      console.log('推送结果:', result.data)
    } else {
      addMessage(`推送发送失败: ${result.message}`, 'error')
    }
  } catch (error) {
    addMessage(`推送发送错误: ${error.message}`, 'error')
  }
}

// 快速测试推送
function testSimplePush() {
  // 安全检查DOM元素是否存在
  if (!pushTitle || !pushContent || !pushDescription || !pushType || !pushMode || !targetType) {
    addMessage('页面元素未正确加载，请刷新页面重试', 'error')
    return
  }

  // 设置默认值
  pushTitle.value = '快速测试推送'
  pushContent.value = `这是一条快速测试推送消息，发送时间: ${new Date().toLocaleString()}`
  pushDescription.value = '快速测试推送功能'
  pushType.value = 'notification'
  pushMode.value = 'immediate'
  targetType.value = 'all'
  
  const notifyOnSuccessElement = document.getElementById('notifyOnSuccess')
  if (notifyOnSuccessElement) {
    notifyOnSuccessElement.checked = false
  }
  
  togglePushModeFields()
  toggleTargetFields()
  toggleSuccessNotificationFields()
  
  sendPush()
}

// 测试成功通知
function testSuccessNotification() {
  // 安全检查DOM元素是否存在
  if (!pushTitle || !pushContent || !pushDescription || !pushType || !pushMode || !targetType) {
    addMessage('页面元素未正确加载，请刷新页面重试', 'error')
    return
  }

  // 设置默认值
  pushTitle.value = '成功通知测试推送'
  pushContent.value = `这是一条测试推送消息，将发送成功通知，发送时间: ${new Date().toLocaleString()}`
  pushDescription.value = '测试推送成功通知功能'
  pushType.value = 'notification'
  pushMode.value = 'immediate'
  targetType.value = 'all'
  
  const notifyOnSuccessElement = document.getElementById('notifyOnSuccess')
  const successTitleElement = document.getElementById('successNotificationTitle')
  const successContentElement = document.getElementById('successNotificationContent')
  
  if (notifyOnSuccessElement) {
    notifyOnSuccessElement.checked = true
  }
  if (successTitleElement) {
    successTitleElement.value = '推送成功通知'
  }
  if (successContentElement) {
    successContentElement.value = '您的测试推送已成功发送给所有用户！'
  }
  
  togglePushModeFields()
  toggleTargetFields()
  toggleSuccessNotificationFields()
  
  sendPush()
}

// 加载任务列表
async function loadTasks() {
  try {
    addMessage('正在加载任务列表...', 'system')
    
    // 获取认证token
    const token = localStorage.getItem('token') || getCookie('token')
    
    const response = await fetch('/api/pusher/tasks?page=1&limit=20', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    const result = await response.json()
    
    if (result.code === 0) {
      displayTasks(result.data.list)
      addMessage(`任务列表加载成功，共 ${result.data.total} 条记录`, 'success')
    } else {
      addMessage(`任务列表加载失败: ${result.message}`, 'error')
    }
  } catch (error) {
    addMessage(`任务列表加载错误: ${error.message}`, 'error')
  }
}

// 显示任务列表
function displayTasks(tasks) {
  if (!taskList) {
    addMessage('任务列表容器未找到', 'error')
    return
  }

  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '<p style="text-align: center; color: #666;">暂无任务</p>'
    return
  }

  const html = tasks.map(task => `
    <div class="task-item">
      <h4>${task.title} <span class="task-status ${task.status}">${task.status}</span></h4>
      <p><strong>内容:</strong> ${task.content}</p>
      <p><strong>类型:</strong> ${task.type} | <strong>方式:</strong> ${task.pushMode} | <strong>目标:</strong> ${task.targetType}</p>
      <p><strong>状态:</strong> ${task.pushStatus} | <strong>发送数:</strong> ${task.totalSent || 0} | <strong>创建时间:</strong> ${new Date(task.createdAt).toLocaleString()}</p>
      ${task.description ? `<p><strong>描述:</strong> ${task.description}</p>` : ''}
    </div>
  `).join('')

  taskList.innerHTML = html
}

// 加载统计信息
async function loadStats() {
  try {
    addMessage('正在加载统计信息...', 'system')
    
    // 获取认证token
    const token = localStorage.getItem('token') || getCookie('token')
    
    const response = await fetch('/api/pusher/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    const result = await response.json()
    
    if (result.code === 0) {
      displayStats(result.data)
      addMessage('统计信息加载成功', 'success')
    } else {
      addMessage(`统计信息加载失败: ${result.message}`, 'error')
    }
  } catch (error) {
    addMessage(`统计信息加载错误: ${error.message}`, 'error')
  }
}

// 显示统计信息
function displayStats(stats) {
  if (!statsContainer) {
    addMessage('统计信息容器未找到', 'error')
    return
  }

  const html = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center;">
        <h4>总任务数</h4>
        <p style="font-size: 24px; font-weight: bold; color: #1976d2;">${stats.total}</p>
      </div>
      <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center;">
        <h4>活跃任务</h4>
        <p style="font-size: 24px; font-weight: bold; color: #2e7d32;">${stats.active}</p>
      </div>
      <div style="background: #fff3e0; padding: 15px; border-radius: 5px; text-align: center;">
        <h4>已发送</h4>
        <p style="font-size: 24px; font-weight: bold; color: #ef6c00;">${stats.sent}</p>
      </div>
      <div style="background: #ffebee; padding: 15px; border-radius: 5px; text-align: center;">
        <h4>失败任务</h4>
        <p style="font-size: 24px; font-weight: bold; color: #c62828;">${stats.failed}</p>
      </div>
      <div style="background: #f3e5f5; padding: 15px; border-radius: 5px; text-align: center;">
        <h4>成功率</h4>
        <p style="font-size: 24px; font-weight: bold; color: #7b1fa2;">${stats.successRate}%</p>
      </div>
      <div style="background: #e0f2f1; padding: 15px; border-radius: 5px; text-align: center;">
        <h4>总发送数</h4>
        <p style="font-size: 24px; font-weight: bold; color: #00695c;">${stats.totalSent}</p>
      </div>
    </div>
  `

  statsContainer.innerHTML = html
}

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
  // 连接控制
  connectBtn = document.getElementById('connectBtn')
  disconnectBtn = document.getElementById('disconnectBtn')
  clearBtn = document.getElementById('clearBtn')
  userIdInput = document.getElementById('userIdInput')
  connectionStatus = document.getElementById('connectionStatus')
  messageContainer = document.getElementById('messageContainer')
  
  // 推送相关元素
  pushTitle = document.getElementById('pushTitle')
  pushContent = document.getElementById('pushContent')
  pushDescription = document.getElementById('pushDescription')
  pushType = document.getElementById('pushType')
  pushMode = document.getElementById('pushMode')
  targetType = document.getElementById('targetType')
  sendPushBtn = document.getElementById('sendPushBtn')
  testSimplePushBtn = document.getElementById('testSimplePushBtn')
  testSuccessNotificationBtn = document.getElementById('testSuccessNotificationBtn')
  
  // 任务管理
  loadTasksBtn = document.getElementById('loadTasksBtn')
  refreshTasksBtn = document.getElementById('refreshTasksBtn')
  taskList = document.getElementById('taskList')
  
  // 统计信息
  loadStatsBtn = document.getElementById('loadStatsBtn')
  statsContainer = document.getElementById('statsContainer')
  
  // 连接控制
  if (connectBtn) connectBtn.addEventListener('click', connect)
  if (disconnectBtn) disconnectBtn.addEventListener('click', disconnect)
  if (clearBtn) clearBtn.addEventListener('click', clearMessages)
  
  // 推送控制
  if (sendPushBtn) sendPushBtn.addEventListener('click', sendPush)
  if (testSimplePushBtn) testSimplePushBtn.addEventListener('click', testSimplePush)
  if (testSuccessNotificationBtn) testSuccessNotificationBtn.addEventListener('click', testSuccessNotification)
  
  // 任务管理
  if (loadTasksBtn) loadTasksBtn.addEventListener('click', loadTasks)
  if (refreshTasksBtn) refreshTasksBtn.addEventListener('click', loadTasks)
  
  // 统计信息
  if (loadStatsBtn) loadStatsBtn.addEventListener('click', loadStats)

  // 初始化
  if (messageContainer) {
    addMessage('Pusher 推送测试平台已加载', 'system')
    addMessage('请先输入用户ID，然后点击连接按钮', 'warning')
  }
  
  // 设置定时推送的最小时间
  const minTime = new Date(Date.now() + 60000).toISOString().slice(0, 16)
  const scheduledTimeElement = document.getElementById('scheduledTime')
  if (scheduledTimeElement) {
    scheduledTimeElement.min = minTime
  }
})
