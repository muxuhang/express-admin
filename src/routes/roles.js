import express from 'express'
import jwt from 'jsonwebtoken'
import Role from '../models/role.js'
import User from '../models/user.js'

const router = express.Router()

// 获取角色列表
router.get('/api/roles', async (req, res) => {
  try {
    const { keyword } = req.query
    const query = keyword
      ? {
          $or: [{ name: new RegExp(keyword, 'i') }, { code: new RegExp(keyword, 'i') }],
        }
      : {}

    const total = await Role.countDocuments(query)
    const roles = await Role.find(query)

    res.json({
      code: 0,
      message: '获取角色列表成功',
      data: {
        total,
        roles,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取角色列表失败',
      error: error.message,
    })
  }
})

// 创建角色
router.post('/api/roles', async (req, res) => {
  try {
    const { name, code, description, permissions } = req.body

    if (!name || !code) {
      return res.status(400).json({
        code: 400,
        message: '角色名称和编码不能为空',
      })
    }

    const existRole = await Role.findOne({ code })
    if (existRole) {
      return res.status(400).json({
        code: 400,
        message: '角色编码已存在',
      })
    }

    const role = await Role.create({
      name,
      code,
      description,
      permissions,
    })

    res.json({
      code: 0,
      message: '创建角色成功',
      data: role,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '创建角色失败',
      error: error.message,
    })
  }
})

// 更新角色
router.put('/api/roles/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, permissions } = req.body

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    if (role.is_system) {
      return res.status(403).json({
        code: 403,
        message: '系统角色不能修改',
      })
    }

    if (name) role.name = name
    if (description) role.description = description
    if (permissions) role.permissions = permissions

    await role.save()

    res.json({
      code: 0,
      message: '更新角色成功',
      data: role,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新角色失败',
      error: error.message,
    })
  }
})

// 删除角色
router.delete('/api/roles/:id', async (req, res) => {
  try {
    const { id } = req.params

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    if (role.is_system) {
      return res.status(403).json({
        code: 403,
        message: '系统角色不能删除',
      })
    }

    // 检查是否有用户使用该角色
    const userCount = await User.countDocuments({ role: role.code })
    if (userCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该角色下还有用户，不能删除',
      })
    }

    await role.deleteOne()

    res.json({
      code: 0,
      message: '删除角色成功',
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除角色失败',
      error: error.message,
    })
  }
})

export default router
