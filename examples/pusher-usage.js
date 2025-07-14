/**
 * Pusher 功能使用示例
 * 
 * 这个文件展示了如何使用 Pusher API 的各种功能
 */

import { formatDateTime } from './src/utils/dateFormatter.js'

/*
* @author muxuhang
* @date 2025-06-27 14:15:00
* @description Pusher API 使用示例
*/

// 推送功能使用示例

// 基础配置
const BASE_URL = 'http://localhost:8888'
const token = 'your-jwt-token'

// 通用请求函数
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  }
  
  const response = await fetch(url, config)
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || '请求失败')
  }
  
  return data
}

// 示例 0: 获取推送目标选项
async function getPushTargets() {
  try {
    const result = await makeRequest('/api/pusher/targets')
    
    console.log('可用用户列表:', result.data.users)
    console.log('可用角色列表:', result.data.roles)
    
    // 用户列表格式
    // [
    //   {
    //     _id: "user-id-1",
    //     username: "admin",
    //     email: "admin@example.com",
    //     role: "admin"
    //   }
    // ]
    
    // 角色列表格式
    // [
    //   {
    //     _id: "role-id-1",
    //     name: "管理员",
    //     code: "admin",
    //     description: "系统管理员，拥有所有权限"
    //   }
    // ]
    
    return result.data
  } catch (error) {
    console.error('获取推送目标选项失败:', error.message)
  }
}

// 示例 1: 立即推送
async function immediatePush() {
  try {
    const result = await makeRequest('/api/pusher/push', {
      method: 'POST',
      body: JSON.stringify({
        title: '重要通知',
        content: '这是一条重要通知消息',
        description: '系统维护通知',
        type: 'notification',
        channel: 'notifications',
        event: 'notification',
        pushMode: 'immediate',
        targetType: 'role',
        targetRoleIds: ['admin', 'manager']
      })
    })
    
    console.log('立即推送成功:', result)
  } catch (error) {
    console.error('立即推送失败:', error.message)
  }
}

// 示例 2: 定时推送
async function scheduledPush() {
  try {
    // 设置明天上午10点的推送
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    
    const result = await makeRequest('/api/pusher/push', {
      method: 'POST',
      body: JSON.stringify({
        title: '定时提醒',
        content: '这是定时提醒消息，请及时处理',
        description: '每日工作提醒',
        type: 'message',
        channel: 'reminders',
        event: 'reminder',
        pushMode: 'scheduled',
        scheduledTime: formatDateTime(tomorrow),
        targetType: 'all'
      })
    })
    
    console.log('定时推送创建成功:', result)
  } catch (error) {
    console.error('定时推送失败:', error.message)
  }
}

// 示例 3: 间隔循环推送
async function intervalRecurringPush() {
  try {
    const result = await makeRequest('/api/pusher/push', {
      method: 'POST',
      body: JSON.stringify({
        title: '定期检查提醒',
        content: '请定期检查系统状态',
        description: '系统监控提醒',
        type: 'announcement',
        channel: 'system-monitor',
        event: 'monitor',
        pushMode: 'recurring',
        recurringConfig: {
          type: 'interval',
          interval: 30,
          intervalUnit: 'minutes',
          maxExecutions: 10
        },
        targetType: 'role',
        targetRoleIds: ['admin']
      })
    })
    
    console.log('间隔循环推送创建成功:', result)
  } catch (error) {
    console.error('间隔循环推送失败:', error.message)
  }
}

// 示例 4: 每日循环推送
async function dailyRecurringPush() {
  try {
    const result = await makeRequest('/api/pusher/push', {
      method: 'POST',
      body: JSON.stringify({
        title: '每日工作提醒',
        content: '新的一天开始了，请查看今日任务',
        description: '每日工作提醒',
        type: 'message',
        channel: 'daily-reminders',
        event: 'daily',
        pushMode: 'recurring',
        recurringConfig: {
          type: 'daily',
          dailyTime: '09:00',
          maxExecutions: 30
        },
        targetType: 'all'
      })
    })
    
    console.log('每日循环推送创建成功:', result)
  } catch (error) {
    console.error('每日循环推送失败:', error.message)
  }
}

// 示例 5: 指定用户推送
async function specificUserPush() {
  try {
    const result = await makeRequest('/api/pusher/push', {
      method: 'POST',
      body: JSON.stringify({
        title: '个人消息',
        content: '这是专门发给您的消息',
        description: '个人通知',
        type: 'message',
        channel: 'personal',
        event: 'personal',
        pushMode: 'immediate',
        targetType: 'specific',
        targetUserIds: ['user-id-1', 'user-id-2']
      })
    })
    
    console.log('指定用户推送成功:', result)
  } catch (error) {
    console.error('指定用户推送失败:', error.message)
  }
}

// 示例 6: 获取推送任务列表
async function getPushTasks() {
  try {
    const result = await makeRequest('/api/pusher/tasks?page=1&limit=10&pushMode=scheduled&status=active')
    console.log('推送任务列表:', result.data)
  } catch (error) {
    console.error('获取推送任务失败:', error.message)
  }
}

// 示例 7: 获取推送统计信息
async function getPushStats() {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // 最近7天
    
    const result = await makeRequest(`/api/pusher/stats?startDate=${formatDateTime(startDate)}&endDate=${formatDateTime(new Date())}`)
    console.log('推送统计信息:', result.data)
  } catch (error) {
    console.error('获取推送统计失败:', error.message)
  }
}

// 示例 8: 获取频道列表
async function getChannels() {
  try {
    const result = await makeRequest('/api/pusher/channels?page=1&limit=10')
    console.log('频道列表:', result.data)
  } catch (error) {
    console.error('获取频道列表失败:', error.message)
  }
}

// 示例 9: 获取在线用户
async function getOnlineUsers() {
  try {
    const channel = 'notifications'
    const result = await makeRequest(`/api/pusher/channels/${channel}/users?page=1&limit=10`)
    console.log('在线用户:', result.data)
  } catch (error) {
    console.error('获取在线用户失败:', error.message)
  }
}

// 示例 10: 复杂推送配置
async function complexPush() {
  try {
    const result = await makeRequest('/api/pusher/push', {
      method: 'POST',
      body: JSON.stringify({
        title: '系统公告',
        content: '系统将于今晚进行维护，请提前保存工作',
        description: '系统维护公告',
        type: 'announcement',
        channel: 'system-announcements',
        event: 'maintenance',
        pushMode: 'scheduled',
        scheduledTime: formatDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2小时后
        targetType: 'role',
        targetRoleIds: ['admin', 'manager', 'user']
      })
    })
    
    console.log('复杂推送配置成功:', result)
  } catch (error) {
    console.error('复杂推送配置失败:', error.message)
  }
}

// 运行示例
async function runExamples() {
  console.log('=== Pusher API 使用示例 ===\n')
  
  // 立即推送
  console.log('1. 立即推送:')
  await immediatePush()
  console.log()
  
  // 定时推送
  console.log('2. 定时推送:')
  await scheduledPush()
  console.log()
  
  // 间隔循环推送
  console.log('3. 间隔循环推送:')
  await intervalRecurringPush()
  console.log()
  
  // 每日循环推送
  console.log('4. 每日循环推送:')
  await dailyRecurringPush()
  console.log()
  
  // 指定用户推送
  console.log('5. 指定用户推送:')
  await specificUserPush()
  console.log()
  
  // 复杂推送配置
  console.log('6. 复杂推送配置:')
  await complexPush()
  console.log()
  
  // 获取频道列表
  console.log('7. 获取频道列表:')
  await getChannels()
  console.log()
  
  // 获取任务列表
  console.log('8. 获取推送任务列表:')
  await getPushTasks()
  console.log()
  
  // 获取统计信息
  console.log('9. 获取推送统计信息:')
  await getPushStats()
  console.log()
  
  // 获取在线用户
  console.log('10. 获取在线用户:')
  await getOnlineUsers()
  console.log()
  
  console.log('=== 示例运行完成 ===')
}

// 如果直接运行此文件，则执行示例
if (typeof require !== 'undefined' && require.main === module) {
  runExamples().catch(console.error)
}

// 导出函数供其他模块使用
export {
  immediatePush,
  scheduledPush,
  intervalRecurringPush,
  dailyRecurringPush,
  specificUserPush,
  getPushTasks,
  getPushStats,
  getChannels,
  getOnlineUsers,
  complexPush,
  runExamples
} 