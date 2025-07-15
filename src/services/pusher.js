import Pusher from 'pusher'
import PushTask from '../models/pushTask.js'
import User from '../models/user.js'
import { getCurrentDateTime, formatDateTime } from '../utils/dateFormatter.js'

// 创建 Pusher 实例
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
})

// 立即推送
const immediatePush = async (pushData, userId, username) => {
  try {
    const { 
      title, 
      content, 
      description,
      type = 'notification',
      targetType = 'all',
      targetUserIds = [],
      targetRoleIds = [],
      notifyOnSuccess = false,
      successNotificationTitle,
      successNotificationContent
    } = pushData
    
    // 获取目标用户列表
    const targetUsers = await getTargetUserIds(targetUserIds, targetRoleIds, targetType)
    
    // 创建推送任务
    const pushTask = await PushTask.create({
      title,
      content,
      description,
      type,
      pushMode: 'immediate',
      targetType,
      targetUserIds,
      targetRoleIds,
      notifyOnSuccess,
      successNotificationTitle,
      successNotificationContent,
      status: 'active',
      pushStatus: 'sending',
      createdBy: userId,
      createdByUsername: username
    })
    
    // 执行推送
    const result = await executePush(pushTask, targetUsers)
    
    // 更新推送任务状态
    await PushTask.findByIdAndUpdate(pushTask._id, {
      pushStatus: result.success ? 'sent' : 'failed',
      totalSent: result.sentCount,
      lastExecutedAt: new Date()
    })
    
    // 添加执行记录
    await pushTask.addExecutionRecord({
      executionTime: new Date(),
      status: result.success ? 'success' : 'failed',
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      errorMessage: result.error
    })
    
    // 如果推送成功且启用了成功通知，发送成功通知
    if (result.success && notifyOnSuccess && successNotificationTitle && successNotificationContent) {
      try {
        await sendSuccessNotification(successNotificationTitle, successNotificationContent, userId, username)
      } catch (notificationError) {
        console.error('发送成功通知失败:', notificationError)
        // 不影响主推送结果，只记录错误
      }
    }
    
    return {
      success: result.success,
      pushTaskId: pushTask._id,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      error: result.error
    }
  } catch (error) {
    throw error
  }
}

// 定时推送
const scheduledPush = async (pushData, userId, username) => {
  try {
    const { 
      title, 
      content, 
      description,
      type = 'notification',
      scheduledTime,
      targetType = 'all',
      targetUserIds = [],
      targetRoleIds = [],
      notifyOnSuccess = false,
      successNotificationTitle,
      successNotificationContent
    } = pushData
    
    // 验证定时时间
    if (!scheduledTime || new Date(scheduledTime) <= new Date()) {
      throw new Error('定时推送时间必须大于当前时间')
    }
    
    // 创建推送任务
    const pushTask = await PushTask.create({
      title,
      content,
      description,
      type,
      pushMode: 'scheduled',
      scheduledTime: new Date(scheduledTime),
      targetType,
      targetUserIds,
      targetRoleIds,
      notifyOnSuccess,
      successNotificationTitle,
      successNotificationContent,
      status: 'active',
      pushStatus: 'draft',
      createdBy: userId,
      createdByUsername: username
    })
    
    return {
      success: true,
      pushTaskId: pushTask._id,
      scheduledTime: new Date(scheduledTime)
    }
  } catch (error) {
    throw error
  }
}

// 循环推送
const recurringPush = async (pushData, userId, username) => {
  try {
    const { 
      title, 
      content, 
      description,
      type = 'notification',
      recurringConfig, 
      targetType = 'all',
      targetUserIds = [],
      targetRoleIds = [],
      notifyOnSuccess = false,
      successNotificationTitle,
      successNotificationContent
    } = pushData
    
    // 验证循环配置
    if (!recurringConfig || (!recurringConfig.interval && !recurringConfig.dailyTime)) {
      throw new Error('循环推送必须配置间隔时间或每日推送时间')
    }
    
    // 验证最大执行次数
    if (!recurringConfig.maxExecutions || recurringConfig.maxExecutions < 1) {
      throw new Error('循环推送必须设置最大执行次数，且必须大于0')
    }
    
    if (recurringConfig.maxExecutions > 1000) {
      throw new Error('最大执行次数不能超过1000')
    }
    
    // 计算下次推送时间
    const nextExecutionTime = calculateNextPushTime(recurringConfig)
    
    // 创建推送任务
    const pushTask = await PushTask.create({
      title,
      content,
      description,
      type,
      pushMode: 'recurring',
      recurringConfig: {
        ...recurringConfig,
        nextExecutionTime,
        executedCount: 0  // 初始执行次数为0，第一次执行时变为1
      },
      targetType,
      targetUserIds,
      targetRoleIds,
      notifyOnSuccess,
      successNotificationTitle,
      successNotificationContent,
      status: 'active',
      pushStatus: 'sending',
      createdBy: userId,
      createdByUsername: username
    })
    
    return {
      success: true,
      pushTaskId: pushTask._id,
      nextExecutionTime
    }
  } catch (error) {
    throw error
  }
}

// 获取目标用户ID列表
const getTargetUserIds = async (targetUserIds, targetRoleIds, targetType) => {
  const userIds = new Set()
  
  if (targetType === 'all') {
    // 获取所有用户
    const allUsers = await User.find({ status: 'active' }).select('_id')
    allUsers.forEach(user => {
      if (user._id) {
        userIds.add(user._id.toString())
      }
    })
  } else if (targetType === 'specific' && targetUserIds?.length > 0) {
    // 指定用户
    targetUserIds.forEach(userId => {
      if (userId) {
        userIds.add(userId.toString())
      }
    })
  } else if (targetType === 'role' && targetRoleIds?.length > 0) {
    // 指定角色
    const roleUsers = await User.find({ 
      role: { $in: targetRoleIds }, 
      status: 'active' 
    }).select('_id')
    roleUsers.forEach(user => {
      if (user._id) {
        userIds.add(user._id.toString())
      }
    })
  }
  
  return Array.from(userIds)
}

// 执行推送
const executePush = async (pushTask, targetUserIds) => {
  try {
    const { title, content } = pushTask
    
    // 构建推送数据
    const pushData = {
      title,
      content,
      from: 'server',
      timestamp: getCurrentDateTime(),
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

// 计算下次推送时间
const calculateNextPushTime = (recurringConfig) => {
  const now = new Date()
  
  if (recurringConfig.type === 'interval' && recurringConfig.interval) {
    // 间隔推送：根据时间单位计算
    const intervalMs = getIntervalMilliseconds(recurringConfig.interval, recurringConfig.intervalUnit)
    return new Date(now.getTime() + intervalMs)
  } else if (recurringConfig.type === 'daily' && recurringConfig.dailyTime) {
    // 每日推送：设置今天的指定时间，如果已过则设置为明天
    const [hours, minutes] = recurringConfig.dailyTime.split(':').map(Number)
    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    
    if (todayTime <= now) {
      // 今天的时间已过，设置为明天
      todayTime.setDate(todayTime.getDate() + 1)
    }
    
    return todayTime
  }
  
  throw new Error('无效的循环推送配置')
}

// 获取间隔时间的毫秒数
const getIntervalMilliseconds = (interval, unit) => {
  switch (unit) {
    case 'minutes':
      return interval * 60 * 1000
    case 'hours':
      return interval * 60 * 60 * 1000
    case 'days':
      return interval * 24 * 60 * 60 * 1000
    default:
      return interval * 60 * 1000 // 默认按分钟计算
  }
}

// 获取频道信息
const getChannelInfo = async (channel) => {
  return await pusher.get({ path: `/channels/${channel}` })
}

// 获取所有频道
const getChannels = async () => {
  return await pusher.get({ path: '/channels' })
}

// 获取在线用户
const getOnlineUsers = async (channel) => {
  const info = await getChannelInfo(channel)
  return info.users || []
}

// 发送推送成功通知
const sendSuccessNotification = async (title, content, userId, username) => {
  try {
    // 构建成功通知数据
    const notificationData = {
      title,
      content,
      type: 'success_notification',
      from: 'system',
      timestamp: getCurrentDateTime(),
      targetUserId: userId,
      createdBy: username
    }
    
    // 发送给推送创建者
    await pusher.trigger(`private-user-${userId}`, 'success_notification', notificationData)
    
    // 同时发送到系统通知频道，供管理员查看
    await pusher.trigger('system-notifications', 'success_notification', {
      ...notificationData,
      message: `推送任务执行成功通知 - ${title}`
    })
    
    return {
      success: true,
      message: '成功通知发送完成'
    }
  } catch (error) {
    console.error('发送成功通知失败:', error)
    throw error
  }
}

// 获取推送任务列表
const getPushTasks = async (filters = {}, page = 1, limit = 10) => {
  try {
    const query = {}
    
    // 添加过滤条件
    if (filters.title) {
      query.title = new RegExp(filters.title, 'i')
    }
    if (filters.content) {
      query.content = new RegExp(filters.content, 'i')
    }
    if (filters.type) {
      query.type = filters.type
    }
    if (filters.pushMode) {
      query.pushMode = filters.pushMode
    }
    if (filters.status) {
      query.status = filters.status
    }
    if (filters.createdBy) {
      query.createdBy = filters.createdBy
    }
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      }
    }
    
    // 计算总数
    const total = await PushTask.countDocuments(query)
    
    // 获取分页数据
    const skip = (page - 1) * limit
    const tasks = await PushTask.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email')
      .populate('targetUserIds', 'username email')
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      list: tasks
    }
  } catch (error) {
    throw error
  }
}

// 暂停/恢复推送任务
const updateTaskStatus = async (taskId, status) => {
  return await PushTask.findByIdAndUpdate(taskId, { status }, { new: true })
}

// 获取推送统计信息
const getPushStats = async (filters = {}) => {
  const query = {}
  
  // 构建查询条件
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    }
  }
  
  if (filters.createdBy) {
    query.createdBy = filters.createdBy
  }
  
  // 获取统计数据
  const totalCount = await PushTask.countDocuments(query)
  const activeCount = await PushTask.countDocuments({ ...query, status: 'active' })
  const inactiveCount = await PushTask.countDocuments({ ...query, status: 'inactive' })
  
  // 推送状态统计
  const draftCount = await PushTask.countDocuments({ ...query, pushStatus: 'draft' })
  const sendingCount = await PushTask.countDocuments({ ...query, pushStatus: 'sending' })
  const sentCount = await PushTask.countDocuments({ ...query, pushStatus: 'sent' })
  const failedCount = await PushTask.countDocuments({ ...query, pushStatus: 'failed' })
  
  // 按推送类型统计
  const typeStats = await PushTask.aggregate([
    { $match: query },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  
  // 按推送方式统计
  const modeStats = await PushTask.aggregate([
    { $match: query },
    { $group: { _id: '$pushMode', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  
  // 按创建者统计
  const creatorStats = await PushTask.aggregate([
    { $match: query },
    { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ])
  
  // 计算总发送数和阅读数
  const totalSent = await PushTask.aggregate([
    { $match: query },
    { $group: { _id: null, totalSent: { $sum: '$totalSent' }, totalRead: { $sum: '$totalRead' } } }
  ])
  
  return {
    total: totalCount,
    active: activeCount,
    inactive: inactiveCount,
    draft: draftCount,
    sending: sendingCount,
    sent: sentCount,
    failed: failedCount,
    successRate: totalCount > 0 ? ((sentCount / totalCount) * 100).toFixed(2) : 0,
    totalSent: totalSent[0]?.totalSent || 0,
    totalRead: totalSent[0]?.totalRead || 0,
    typeStats,
    modeStats,
    creatorStats
  }
}

// 更新推送任务
const updatePushTask = async (taskId, updateData, userId, role) => {
  try {
    // 构建查询条件
    const query = { _id: taskId }
    if (role !== 'admin') {
      query.createdBy = userId
    }
    
    // 检查任务是否存在且有权限编辑
    const existingTask = await PushTask.findOne(query)
    if (!existingTask) {
      return null
    }
    
    // 只允许编辑活跃或暂停状态的任务
    if (!['active', 'inactive'].includes(existingTask.status)) {
      throw new Error('只能编辑启用或禁用状态的任务')
    }
    
    // 构建更新数据
    const taskUpdateData = {
      title: updateData.title,
      content: updateData.content,
      description: updateData.description,
      type: updateData.type,
      targetType: updateData.targetType,
      targetUserIds: updateData.targetUserIds,
      targetRoleIds: updateData.targetRoleIds,
      status: updateData.status,
      notifyOnSuccess: updateData.notifyOnSuccess,
      successNotificationTitle: updateData.successNotificationTitle,
      successNotificationContent: updateData.successNotificationContent,
      updatedAt: new Date()
    }
    
    // 如果更新定时时间，需要重新验证
    if (updateData.scheduledTime) {
      if (new Date(updateData.scheduledTime) <= new Date()) {
        throw new Error('定时推送时间必须大于当前时间')
      }
      taskUpdateData.scheduledTime = new Date(updateData.scheduledTime)
    }
    
    // 如果更新循环配置，需要重新计算下次执行时间
    if (updateData.recurringConfig) {
      const nextExecutionTime = calculateNextPushTime(updateData.recurringConfig)
      taskUpdateData.recurringConfig = {
        ...updateData.recurringConfig,
        nextExecutionTime
      }
    }
    
    // 更新推送任务
    const updatedTask = await PushTask.findByIdAndUpdate(
      taskId,
      taskUpdateData,
      { new: true }
    ).populate('createdBy', 'username email')
    .populate('targetUserIds', 'username email')
    
    return updatedTask
  } catch (error) {
    throw error
  }
}

// 获取单个推送任务详情
const getPushTaskById = async (taskId, userId, role) => {
  try {
    // 构建查询条件
    const query = { _id: taskId }
    if (role !== 'admin') {
      query.createdBy = userId
    }
    
    const task = await PushTask.findOne(query)
      .populate('createdBy', 'username email')
      .populate('targetUserIds', 'username email')
    
    return task
  } catch (error) {
    throw error
  }
}

// 删除推送任务
const deletePushTask = async (taskId, userId, role) => {
  try {
    // 构建查询条件
    const query = { _id: taskId }
    if (role !== 'admin') {
      query.createdBy = userId
    }
    
    // 检查任务是否存在且有权限删除
    const existingTask = await PushTask.findOne(query)
    if (!existingTask) {
      return null
    }
    
    // 只允许删除启用或禁用状态的任务
    if (!['active', 'inactive'].includes(existingTask.status)) {
      throw new Error('只能删除启用或禁用状态的任务')
    }
    
    // 删除推送任务
    const deletedTask = await PushTask.findByIdAndDelete(taskId)
    
    return deletedTask
  } catch (error) {
    throw error
  }
}

// 执行定时任务
const executeScheduledTasks = async () => {
  try {
    const tasks = await PushTask.getActiveScheduledTasks()
    
    for (const task of tasks) {
      try {
        // 更新推送状态为发送中
        await PushTask.findByIdAndUpdate(task._id, {
          pushStatus: 'sending'
        })
        
        // 获取目标用户
        const targetUsers = await getTargetUserIds(
          task.targetUserIds, 
          task.targetRoleIds, 
          task.targetType
        )
        
        // 执行推送
        const result = await executePush(task, targetUsers)
        
        // 更新任务状态
        await task.addExecutionRecord({
          executionTime: new Date(),
          status: result.success ? 'success' : 'failed',
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          errorMessage: result.error
        })
        
        // 更新推送状态
        await PushTask.findByIdAndUpdate(task._id, {
          pushStatus: result.success ? 'sent' : 'failed',
          totalSent: result.sentCount,
          lastExecutedAt: new Date()
        })
        
        // 如果推送成功且启用了成功通知，发送成功通知
        if (result.success && task.notifyOnSuccess && task.successNotificationTitle && task.successNotificationContent) {
          try {
            await sendSuccessNotification(
              task.successNotificationTitle, 
              task.successNotificationContent, 
              task.createdBy._id, 
              task.createdByUsername
            )
          } catch (notificationError) {
            console.error('发送定时任务成功通知失败:', notificationError)
            // 不影响主推送结果，只记录错误
          }
        }
        
        // 定时任务执行完成后保持sent状态，不重置为draft
        // 这样可以避免重复执行的问题
        console.log(`定时任务 ${task._id} 执行完成，状态: ${result.success ? 'sent' : 'failed'}`)
        
      } catch (error) {
        console.error(`执行定时任务失败: ${task._id}`, error)
        
        // 记录失败
        await task.addExecutionRecord({
          executionTime: new Date(),
          status: 'failed',
          sentCount: 0,
          failedCount: 0,
          errorMessage: error.message
        })
        
        // 标记为失败
        await PushTask.findByIdAndUpdate(task._id, {
          pushStatus: 'failed'
        })
      }
    }
  } catch (error) {
    console.error('执行定时任务失败:', error)
  }
}

// 执行循环任务
const executeRecurringTasks = async () => {
  try {
    const tasks = await PushTask.getActiveRecurringTasks()
    
    for (const task of tasks) {
      try {
        // 重新获取任务最新状态，避免并发问题
        const freshTask = await PushTask.findById(task._id)
        if (!freshTask || freshTask.status !== 'active') {
          console.log(`循环任务 ${task._id} 状态不是active，跳过执行`)
          continue
        }
        
        // 检查推送状态，确保任务没有被停止
        if (freshTask.pushStatus === 'completed' || freshTask.pushStatus === 'failed') {
          console.log(`循环任务 ${task._id} 推送状态为 ${freshTask.pushStatus}，跳过执行`)
          continue
        }
        
        // 加强检查是否达到最大执行次数
        const currentExecutedCount = freshTask.recurringConfig.executedCount || 0
        const maxExecutions = freshTask.recurringConfig.maxExecutions
        
        if (maxExecutions && currentExecutedCount >= maxExecutions) {
          // 达到最大执行次数，将任务状态设置为completed并跳过执行
          await PushTask.findByIdAndUpdate(freshTask._id, {
            pushStatus: 'completed',
            updatedAt: new Date()
          })
          console.log(`循环任务 ${freshTask._id} 已达到最大执行次数 ${maxExecutions}，任务已完成`)
          continue
        }
        
        // 更新推送状态为发送中（如果当前不是sending状态）
        if (freshTask.pushStatus !== 'sending') {
          await PushTask.findByIdAndUpdate(freshTask._id, {
            pushStatus: 'sending'
          })
        }
        
        // 获取目标用户
        const targetUsers = await getTargetUserIds(
          freshTask.targetUserIds, 
          freshTask.targetRoleIds, 
          freshTask.targetType
        )
        
        // 执行推送
        const result = await executePush(freshTask, targetUsers)
        
        // 计算下次执行时间（在执行记录之前计算，避免影响当前执行）
        const nextExecutionTime = freshTask.calculateNextExecutionTime()
        
        // 更新执行次数和下次执行时间
        const newExecutedCount = currentExecutedCount + 1
        
        // 检查是否达到最大执行次数
        const shouldComplete = maxExecutions && newExecutedCount >= maxExecutions
        
        // 添加执行记录（包含总次数信息）
        await freshTask.addExecutionRecord({
          executionTime: new Date(),
          status: result.success ? 'success' : 'failed',
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          errorMessage: result.error,
          executionCount: newExecutedCount,
          maxExecutions: maxExecutions
        })
        
        // 如果推送成功且启用了成功通知，发送成功通知
        if (result.success && freshTask.notifyOnSuccess && freshTask.successNotificationTitle && freshTask.successNotificationContent) {
          try {
            await sendSuccessNotification(
              freshTask.successNotificationTitle, 
              freshTask.successNotificationContent, 
              freshTask.createdBy._id, 
              freshTask.createdByUsername
            )
          } catch (notificationError) {
            console.error('发送循环任务成功通知失败:', notificationError)
            // 不影响主推送结果，只记录错误
          }
        }
        
        // 更新任务状态
        if (nextExecutionTime && !shouldComplete) {
          // 还有下次执行，保持sending状态，更新下次执行时间和执行次数
          await PushTask.findByIdAndUpdate(freshTask._id, {
            'recurringConfig.nextExecutionTime': nextExecutionTime,
            'recurringConfig.executedCount': newExecutedCount,
            pushStatus: 'sending', // 保持推送中状态
            totalSent: freshTask.totalSent + result.sentCount,
            updatedAt: new Date()
          })
          
          console.log(`循环任务 ${freshTask._id} 执行完成，已执行 ${newExecutedCount}/${maxExecutions || '∞'} 次，下次执行时间: ${formatDateTime(nextExecutionTime)}`)
        } else if (shouldComplete) {
          // 达到最大执行次数，完成任务，设置为completed状态
          await PushTask.findByIdAndUpdate(freshTask._id, {
            pushStatus: 'completed', // 使用completed状态表示循环任务已完成
            'recurringConfig.executedCount': newExecutedCount,
            totalSent: freshTask.totalSent + result.sentCount,
            updatedAt: new Date()
          })
          
          console.log(`循环任务 ${freshTask._id} 已完成，总共执行 ${newExecutedCount}/${maxExecutions} 次`)
        } else {
          // 无法计算下次执行时间，标记为失败
          await PushTask.findByIdAndUpdate(freshTask._id, {
            pushStatus: 'failed',
            'recurringConfig.executedCount': newExecutedCount,
            updatedAt: new Date()
          })
          console.error(`循环任务 ${freshTask._id} 无法计算下次执行时间`)
        }
        
      } catch (error) {
        console.error(`执行循环任务失败: ${task._id}`, error)
        
        // 记录失败
        await task.addExecutionRecord({
          executionTime: new Date(),
          status: 'failed',
          sentCount: 0,
          failedCount: 0,
          errorMessage: error.message
        })
        
        // 标记为失败
        await PushTask.findByIdAndUpdate(task._id, {
          pushStatus: 'failed',
          updatedAt: new Date()
        })
      }
    }
  } catch (error) {
    console.error('执行循环任务失败:', error)
  }
}

// 重置定时任务状态（允许重新执行）
const resetScheduledTask = async (taskId, userId, role) => {
  try {
    // 构建查询条件
    const query = { _id: taskId }
    if (role !== 'admin') {
      query.createdBy = userId
    }
    
    // 检查任务是否存在且有权限编辑
    const existingTask = await PushTask.findOne(query)
    if (!existingTask) {
      return null
    }
    
    // 只允许重置定时任务
    if (existingTask.pushMode !== 'scheduled') {
      throw new Error('只能重置定时任务状态')
    }
    
    // 检查任务是否已经执行过
    if (existingTask.pushStatus !== 'sent' && existingTask.pushStatus !== 'failed') {
      throw new Error('只能重置已执行的任务状态')
    }
    
    // 检查定时时间是否已过期
    if (existingTask.scheduledTime <= new Date()) {
      throw new Error('定时时间已过期，无法重新执行')
    }
    
    // 重置任务状态
    const updatedTask = await PushTask.findByIdAndUpdate(taskId, {
      pushStatus: 'draft',
      updatedAt: new Date()
    }, { new: true })
    
    return updatedTask
  } catch (error) {
    throw error
  }
}

export default {
  immediatePush,
  scheduledPush,
  recurringPush,
  updatePushTask,
  getPushTaskById,
  deletePushTask,
  getChannelInfo,
  getChannels,
  getOnlineUsers,
  getPushTasks,
  updateTaskStatus,
  getPushStats,
  executeScheduledTasks,
  executeRecurringTasks,
  resetScheduledTask
} 