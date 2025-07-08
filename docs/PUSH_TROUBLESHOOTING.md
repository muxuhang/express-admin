# 推送通知故障排除指南

## 问题：前端没有接收到通知

### 🔍 排查步骤

#### 1. 检查前端连接状态

**问题现象：** 前端显示"未连接"状态

**解决方案：**
- 确认 Pusher 配置是否正确
- 检查网络连接
- 查看浏览器控制台是否有错误信息

**检查项：**
```javascript
// 检查 Pusher 配置
const process = {
  key: '4e0ed1e3365085e2836d',  // 确认这是正确的 key
  cluster: 'mt1',               // 确认这是正确的 cluster
}
```

#### 2. 检查频道订阅

**问题现象：** 连接成功但收不到消息

**解决方案：**
- 确认订阅了正确的频道
- 检查频道名称拼写

**正确的频道订阅：**
```javascript
// 系统通知频道（接收所有推送消息）
const systemChannel = pusher.subscribe('system-notifications')

// 用户私有频道（接收成功通知）
const userChannel = pusher.subscribe(`private-user-${userId}`)
```

#### 3. 检查事件监听

**问题现象：** 订阅成功但收不到消息

**解决方案：**
- 确认监听了正确的事件名称
- 检查事件绑定代码

**正确的事件监听：**
```javascript
// 监听推送消息
systemChannel.bind('notification', (data) => {
  console.log('收到推送通知:', data)
})

// 监听成功通知
systemChannel.bind('success_notification', (data) => {
  console.log('收到系统成功通知:', data)
})

userChannel.bind('success_notification', (data) => {
  console.log('收到个人成功通知:', data)
})
```

#### 4. 检查后端推送逻辑

**问题现象：** 前端连接正常但收不到消息

**解决方案：**
- 检查后端推送服务是否正常运行
- 确认推送数据格式正确
- 查看服务器日志

**检查推送服务：**
```javascript
// 在 src/services/pusher.js 中检查 executePush 函数
const executePush = async (pushTask, targetUserIds) => {
  try {
    const { title, content } = pushTask
    
    // 构建推送数据
    const pushData = {
      title,
      content,
      from: 'server',
      timestamp: new Date().toISOString(),
      targetUserIds
    }
    
    // 触发 Pusher 事件
    await pusher.trigger('system-notifications', 'notification', pushData)
    
    return {
      success: true,
      sentCount: targetUserIds.length,
      failedCount: 0,
      error: null
    }
  } catch (error) {
    return {
      success: false,
      sentCount: 0,
      failedCount: targetUserIds.length,
      error: error.message
    }
  }
}
```

#### 5. 检查成功通知逻辑

**问题现象：** 收到推送消息但没有成功通知

**解决方案：**
- 确认推送任务启用了成功通知
- 检查成功通知的发送逻辑

**检查成功通知配置：**
```javascript
// 推送请求中必须包含以下字段
{
  notifyOnSuccess: true,
  successNotificationTitle: "推送成功通知",
  successNotificationContent: "您的推送任务已成功发送！"
}
```

### 🛠️ 调试工具

#### 1. 使用测试页面

访问 `http://localhost:3000/pusher-test.html` 进行测试：

1. 输入用户ID
2. 点击"连接"按钮
3. 点击"测试推送通知"按钮
4. 观察是否收到消息

#### 2. 浏览器控制台调试

```javascript
// 检查 Pusher 连接状态
console.log('Pusher 连接状态:', pusher.connection.state)

// 检查频道订阅状态
console.log('系统频道:', systemChannel)
console.log('用户频道:', userChannel)

// 手动触发测试
testPushNotification()
```

#### 3. 服务器日志检查

查看服务器控制台输出：
```bash
# 检查推送服务日志
console.log('推送任务创建:', pushTask)
console.log('推送执行结果:', result)
console.log('成功通知发送:', notificationResult)
```

### 🔧 常见问题解决

#### 问题1：Pusher 连接失败

**错误信息：** `Pusher connection failed`

**解决方案：**
1. 检查 Pusher 配置是否正确
2. 确认网络连接正常
3. 检查防火墙设置

#### 问题2：频道订阅失败

**错误信息：** `pusher:subscription_error`

**解决方案：**
1. 检查频道名称是否正确
2. 确认用户有权限订阅该频道
3. 检查 Pusher 应用设置

#### 问题3：事件监听无效

**现象：** 连接正常但收不到消息

**解决方案：**
1. 确认事件名称拼写正确
2. 检查事件绑定时机
3. 确认频道订阅成功后再绑定事件

#### 问题4：成功通知不发送

**现象：** 推送成功但没有成功通知

**解决方案：**
1. 确认 `notifyOnSuccess` 为 `true`
2. 确认提供了 `successNotificationTitle` 和 `successNotificationContent`
3. 检查成功通知发送逻辑

### 📋 检查清单

- [ ] Pusher 配置正确（key, cluster）
- [ ] 前端成功连接到 Pusher
- [ ] 订阅了正确的频道（system-notifications, private-user-{userId}）
- [ ] 监听了正确的事件（notification, success_notification）
- [ ] 后端推送服务正常运行
- [ ] 推送请求包含正确的参数
- [ ] 成功通知配置正确
- [ ] 服务器日志无错误

### 🚀 快速测试

1. **基础连接测试：**
```javascript
// 在浏览器控制台运行
const pusher = new Pusher('4e0ed1e3365085e2836d', { cluster: 'mt1' })
const channel = pusher.subscribe('system-notifications')
channel.bind('notification', (data) => console.log('收到消息:', data))
```

2. **推送测试：**
```javascript
// 发送测试推送
fetch('/api/pusher/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '测试推送',
    content: '测试内容',
    pushMode: 'immediate',
    targetType: 'all',
    notifyOnSuccess: true,
    successNotificationTitle: '测试成功',
    successNotificationContent: '推送成功！'
  })
})
```

### 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. 浏览器控制台错误信息
2. 服务器日志输出
3. 推送请求的完整参数
4. 前端连接状态截图
5. 使用的测试步骤 