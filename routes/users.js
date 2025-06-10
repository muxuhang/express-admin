import express from 'express'
import User from '../models/user.js'
import { checkPermissions } from '../middleware/auth.js'

const router = express.Router()

// Get all users
router.get('/api/users', checkPermissions(['view_users']), async (req, res) => {
  try {
    console.log('User',User)
    const { keyword } = req.query
    const query = keyword
      ? {
          $or: [
            { username: new RegExp(keyword, 'i') },
            { email: new RegExp(keyword, 'i') }
          ]
        }
      : {}

    const total = await User.countDocuments(query)
    const users = await User.find(query)

    res.json({
      code: 0,
      message: '获取用户列表成功',
      data: {
        total,
        users
      }
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败',
      error: error.message
    })
  }
})

// Get user by ID
router.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id, { password: 0 })
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    res.json({
      code: 0,
      message: '获取用户信息成功',
      data: user
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      error: error.message
    })
  }
})

// Create new user
router.post('/api/users', checkPermissions(['create_user']), async (req, res) => {
  try {
    const userData = req.body
    const user = new User(userData)
    await user.save()

    res.json({
      code: 0,
      message: '创建用户成功',
      data: { ...user.toObject(), password: undefined }
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '创建用户失败',
      error: error.message
    })
  }
})

// Update user
router.put('/api/users/:id', checkPermissions(['edit_user']), async (req, res) => {
  try {
    const { id } = req.params
    const userData = req.body

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    Object.assign(user, userData)
    await user.save()

    res.json({
      code: 0,
      message: '更新用户成功',
      data: { ...user.toObject(), password: undefined }
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新用户失败',
      error: error.message
    })
  }
})

// Delete user
router.delete('/api/users/:id', checkPermissions(['delete_user']), async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    await user.deleteOne()

    res.json({
      code: 0,
      message: '删除用户成功'
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除用户失败',
      error: error.message
    })
  }
})

export default router
