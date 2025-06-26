import express from 'express'
import User from '../models/user.js'
import Role from '../models/role.js'
import handleError from '../utils/handleError.js'
import authLogin from '../middleware/authLogin.js'

const router = express.Router()

// 获取用户列表
router.get('/api/users', authLogin, async (req, res) => {
  try {
    const { keyword, status, page = 1, limit = 10 } = req.query
    const query = {}

    if (keyword) {
      query.$or = [
        { username: new RegExp(keyword, 'i') },
        { email: new RegExp(keyword, 'i') },
        { phone: new RegExp(keyword, 'i') },
      ]
    }

    if (status) {
      query.status = status
    }

    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      code: 0,
      message: '获取用户列表成功',
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: users,
      },
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取可用角色列表（用于用户创建/编辑时的角色选择）
router.get('/api/users-roles', authLogin, async (req, res) => {
  try {
    // 只返回启用状态的角色
    const roles = await Role.find({ status: 'active' }).sort({ createdAt: -1 }).select('name code description')

    res.json({
      code: 0,
      message: '获取角色列表成功',
      data: roles,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 查看用户详情
router.get('/api/users/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id, { password: 0 })
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 0, message: '获取用户信息成功', data: user })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 创建新用户
router.post('/api/users', authLogin, async (req, res) => {
  try {
    const userData = req.body

    // 检查手机号是否已存在（如果提供了手机号）
    if (userData.phone) {
      const existPhone = await User.findOne({ phone: userData.phone })
      if (existPhone) {
        return res.status(400).json({ code: 400, message: '手机号已存在' })
      }
    }

    // 验证角色是否存在且为启用状态
    if (userData.role) {
      const role = await Role.findOne({ code: userData.role, status: 'active' })
      if (!role) {
        return res.status(400).json({ code: 400, message: '指定的角色不存在或已被停用' })
      }
    }

    const user = new User(userData)
    await user.save()
    res.json({ code: 0, message: '创建用户成功', data: { ...user.toObject(), password: undefined } })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 修改用户信息
router.put('/api/users/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const userData = req.body

    // 检查手机号是否已被其他用户使用（如果提供了手机号）
    if (userData.phone) {
      const existPhone = await User.findOne({ phone: userData.phone, _id: { $ne: id } })
      if (existPhone) {
        return res.status(400).json({ code: 400, message: '手机号已被其他用户使用' })
      }
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    Object.assign(user, userData)
    await user.save()

    res.json({ code: 0, message: '更新用户成功', data: { ...user.toObject(), password: undefined } })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 删除用户
router.delete('/api/users/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const currentUser = req.user // 当前登录用户

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    // 不能删除自己的账号
    if (id === currentUser._id.toString()) {
      return res.status(400).json({ code: 400, message: '不能删除自己的账号' })
    }

    // 不能删除管理员账号
    if (user.role === 'admin') {
      return res.status(400).json({ code: 400, message: '不能删除管理员账号' })
    }

    await user.deleteOne()
    res.json({ code: 0, message: '删除用户成功' })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router
