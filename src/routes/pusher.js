import express from 'express'
import pusherService from '../services/pusher.js'
import handleError from '../utils/handleError.js'
import authLogin from '../middleware/authLogin.js'
import User from '../models/user.js'
import Role from '../models/role.js'

const router = express.Router()

// 1. 创建推送任务
router.post('/api/pusher/push', authLogin, async (req, res) => {
  try {
    const {
      title,
      content,
      description,
      type = 'notification',
      channel,
      event = 'notification',
      pushMode = 'immediate', // immediate, scheduled, recurring
      scheduledTime, // 定时推送时间
      recurringConfig, // 循环推送配置
      targetType = 'all',
      targetUserIds = [],
      targetRoleIds = [],
      notifyOnSuccess = false, // 推送成功后是否推送消息给用户
      successNotificationTitle, // 成功通知标题
      successNotificationContent, // 成功通知内容
    } = req.body
    console.log(req.body)
    const { _id: userId, username } = req.user

    // 基础验证
    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: '标题和内容为必填项',
      })
    }

    // 验证推送成功通知配置
    if (notifyOnSuccess) {
      if (!successNotificationTitle) {
        return res.status(400).json({
          code: 400,
          message: '启用推送成功通知时必须设置通知标题',
        })
      }
      if (!successNotificationContent) {
        return res.status(400).json({
          code: 400,
          message: '启用推送成功通知时必须设置通知内容',
        })
      }
    }

    // 验证推送方式
    if (!['immediate', 'scheduled', 'recurring'].includes(pushMode)) {
      return res.status(400).json({
        code: 400,
        message: '推送方式必须为 immediate、scheduled 或 recurring',
      })
    }

    // 验证目标类型
    if (targetType === 'specific' && targetUserIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '指定用户推送时必须选择目标用户',
      })
    }

    if (targetType === 'role' && targetRoleIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '指定角色推送时必须选择目标角色',
      })
    }

    // 根据推送方式进行特定验证
    if (pushMode === 'scheduled') {
      if (!scheduledTime) {
        return res.status(400).json({
          code: 400,
          message: '定时推送必须设置推送时间',
        })
      }
      if (new Date(scheduledTime) <= new Date()) {
        return res.status(400).json({
          code: 400,
          message: '定时推送时间必须大于当前时间',
        })
      }
    }

    if (pushMode === 'recurring') {
      if (!recurringConfig) {
        return res.status(400).json({
          code: 400,
          message: '循环推送必须提供循环配置',
        })
      }
      if (!recurringConfig.type || !['interval', 'daily'].includes(recurringConfig.type)) {
        return res.status(400).json({
          code: 400,
          message: '循环类型必须为 interval 或 daily',
        })
      }
      if (recurringConfig.type === 'interval' && !recurringConfig.interval) {
        return res.status(400).json({
          code: 400,
          message: '间隔推送必须设置间隔时间',
        })
      }
      if (recurringConfig.type === 'daily' && !recurringConfig.dailyTime) {
        return res.status(400).json({
          code: 400,
          message: '每日推送必须设置推送时间（HH:mm格式）',
        })
      }

      // 验证 executedCount
      if (recurringConfig.executedCount !== undefined) {
        if (!Number.isInteger(recurringConfig.executedCount)) {
          return res.status(400).json({
            code: 400,
            message: '执行次数必须为整数',
          })
        }
        if (recurringConfig.executedCount < 1 || recurringConfig.executedCount > 100) {
          return res.status(400).json({
            code: 400,
            message: '执行次数必须在1-100之间',
          })
        }
      }
    }

    // 构建推送数据
    const pushData = {
      title,
      content,
      description,
      type,
      channel,
      event,
      pushMode,
      scheduledTime,
      recurringConfig,
      targetType,
      targetUserIds,
      targetRoleIds,
      notifyOnSuccess,
      successNotificationTitle,
      successNotificationContent,
    }

    // 根据推送方式调用相应的服务方法
    let result
    switch (pushMode) {
      case 'immediate':
        result = await pusherService.immediatePush(pushData, userId, username)
        break
      case 'scheduled':
        result = await pusherService.scheduledPush(pushData, userId, username)
        break
      case 'recurring':
        result = await pusherService.recurringPush(pushData, userId, username)
        break
      default:
        throw new Error('不支持的推送方式')
    }

    // 根据推送方式返回相应的消息
    let message
    switch (pushMode) {
      case 'immediate':
        message = result.success ? '消息推送成功' : '消息推送失败'
        break
      case 'scheduled':
        message = '定时推送任务创建成功'
        break
      case 'recurring':
        message = '循环推送任务创建成功'
        break
    }

    res.json({
      code: 0,
      data: result,
      message,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 2. 获取推送任务列表
router.get('/api/pusher/tasks', authLogin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      taskType,
      status,
      title,
      content,
      channel,
      type,
      pushMode,
      sendStatus,
      startDate,
      endDate,
    } = req.query

    const filters = {
      taskType,
      status,
      title,
      content,
      channel,
      type,
      pushMode,
      sendStatus,
      startDate,
      endDate,
    }

    // 如果不是管理员，只能查看自己的任务
    if (req.user.role !== 'admin') {
      filters.createdBy = req.user._id
    }

    const result = await pusherService.getPushTasks(filters, page, limit)

    res.json({
      code: 0,
      data: result,
      message: '获取推送任务列表成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 3. 修改推送任务
router.put('/api/pusher/tasks/:taskId', authLogin, async (req, res) => {
  try {
    const { taskId } = req.params
    const {
      title,
      content,
      description,
      type,
      channel,
      event,
      scheduledTime,
      recurringConfig,
      targetType,
      targetUserIds,
      targetRoleIds,
      status,
      notifyOnSuccess,
      successNotificationTitle,
      successNotificationContent,
    } = req.body
    const { _id: userId, role } = req.user

    // 基础验证
    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: '标题和内容为必填项',
      })
    }

    // 验证推送成功通知配置
    if (notifyOnSuccess) {
      if (!successNotificationTitle) {
        return res.status(400).json({
          code: 400,
          message: '启用推送成功通知时必须设置通知标题',
        })
      }
      if (!successNotificationContent) {
        return res.status(400).json({
          code: 400,
          message: '启用推送成功通知时必须设置通知内容',
        })
      }
    }

    // 验证目标类型
    if (targetType === 'specific' && targetUserIds?.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '指定用户推送时必须选择目标用户',
      })
    }

    if (targetType === 'role' && targetRoleIds?.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '指定角色推送时必须选择目标角色',
      })
    }

    // 验证定时任务时间
    if (scheduledTime && new Date(scheduledTime) <= new Date()) {
      return res.status(400).json({
        code: 400,
        message: '定时推送时间必须大于当前时间',
      })
    }

    // 验证循环配置
    if (recurringConfig) {
      if (!recurringConfig.type || !['interval', 'daily'].includes(recurringConfig.type)) {
        return res.status(400).json({
          code: 400,
          message: '循环类型必须为 interval 或 daily',
        })
      }
      if (recurringConfig.type === 'interval' && !recurringConfig.interval) {
        return res.status(400).json({
          code: 400,
          message: '间隔推送必须设置间隔时间',
        })
      }
      if (recurringConfig.type === 'daily' && !recurringConfig.dailyTime) {
        return res.status(400).json({
          code: 400,
          message: '每日推送必须设置推送时间（HH:mm格式）',
        })
      }
    }

    const result = await pusherService.updatePushTask(
      taskId,
      {
        title,
        content,
        description,
        type,
        channel,
        event,
        scheduledTime,
        recurringConfig,
        targetType,
        targetUserIds,
        targetRoleIds,
        status,
        notifyOnSuccess,
        successNotificationTitle,
        successNotificationContent,
      },
      userId,
      role
    )

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '推送任务不存在或无权限编辑',
      })
    }

    res.json({
      code: 0,
      data: result,
      message: '推送任务更新成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 4. 删除推送任务
router.delete('/api/pusher/tasks/:taskId', authLogin, async (req, res) => {
  try {
    const { taskId } = req.params
    const { _id: userId, role } = req.user

    const result = await pusherService.deletePushTask(taskId, userId, role)

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '推送任务不存在或无权限删除',
      })
    }

    res.json({
      code: 0,
      data: result,
      message: '推送任务删除成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取推送任务详情
router.get('/api/pusher/tasks/:taskId', authLogin, async (req, res) => {
  try {
    const { taskId } = req.params
    const { _id: userId, role } = req.user

    const result = await pusherService.getPushTaskById(taskId, userId, role)

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '推送任务不存在或无权限查看',
      })
    }

    res.json({
      code: 0,
      data: result,
      message: '获取推送任务详情成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 暂停/恢复推送任务
router.patch('/api/pusher/tasks/:taskId/status', authLogin, async (req, res) => {
  try {
    const { taskId } = req.params
    const { status } = req.body

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的任务状态',
      })
    }

    const result = await pusherService.updateTaskStatus(taskId, status)

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '推送任务不存在',
      })
    }

    res.json({
      code: 0,
      data: result,
      message: '任务状态更新成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取推送统计信息
router.get('/api/pusher/stats', authLogin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const filters = {
      startDate,
      endDate,
    }

    // 如果不是管理员，只能查看自己的统计
    if (req.user.role !== 'admin') {
      filters.createdBy = req.user._id
    }

    const result = await pusherService.getPushStats(filters)

    res.json({
      code: 0,
      data: result,
      message: '获取推送统计信息成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取推送目标选项（用户列表和角色列表）
router.get('/api/pusher/targets', authLogin, async (req, res) => {
  try {
    // 获取活跃用户列表
    const users = await User.find({ status: 'active' }).select('_id username email role').sort({ username: 1 })

    // 获取活跃角色列表
    const roles = await Role.find({ status: 'active' }).select('_id name code description').sort({ name: 1 })

    res.json({
      code: 0,
      data: {
        users: users.map((user) => ({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        })),
        roles: roles.map((role) => ({
          _id: role._id,
          name: role.name,
          code: role.code,
          description: role.description,
        })),
      },
      message: '获取推送目标选项成功',
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router
