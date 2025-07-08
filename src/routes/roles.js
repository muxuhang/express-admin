import express from 'express'
import jwt from 'jsonwebtoken'
import Role from '../models/role.js'
import User from '../models/user.js'
import Menu from '../models/menu.js'
import authLogin from '../middleware/authLogin.js'
import mongoose from 'mongoose'

const router = express.Router()

// 获取角色列表
router.get('/api/roles', authLogin, async (req, res) => {
  try {
    const { keyword, status, page = 1, limit = 10 } = req.query
    const query = {}

    if (keyword) {
      query.$or = [{ name: new RegExp(keyword, 'i') }, { code: new RegExp(keyword, 'i') }]
    }

    if (status) {
      query.status = status
    }

    const total = await Role.countDocuments(query)
    const roles = await Role.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      code: 0,
      message: '获取角色列表成功',
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: roles,
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

// 获取所有角色（用于下拉选择）
router.get('/api/roles-all', authLogin, async (req, res) => {
  try {
    const { status } = req.query
    const query = {}

    // 只有在明确传入 status 参数时才进行状态筛选
    if (status) {
      query.status = status
    }

    const roles = await Role.find(query).sort({ createdAt: -1 }).select('name code description status')

    res.json({
      code: 0,
      message: '获取角色列表成功',
      data: roles,
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
router.post('/api/roles', authLogin, async (req, res) => {
  try {
    const { name, code, description, permissions, status = 'active' } = req.body

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
      status,
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
router.put('/api/roles/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, permissions, status } = req.body

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    if (name) role.name = name
    if (description !== undefined) role.description = description
    if (permissions) role.permissions = permissions
    if (status && ['active', 'inactive'].includes(status)) {
      role.status = status
    }

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

// 启用/停用角色
router.patch('/api/roles/:id/status', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '状态值无效',
      })
    }

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    role.status = status
    await role.save()

    res.json({
      code: 0,
      message: `角色${status === 'active' ? '启用' : '停用'}成功`,
      data: role,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新角色状态失败',
      error: error.message,
    })
  }
})

// 初始化默认角色
router.post('/api/roles/init', authLogin, async (req, res) => {
  try {
    // 检查当前用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '只有管理员可以初始化默认角色',
      })
    }

    const { initDefaultRoles } = await import('../models/role.js')
    await initDefaultRoles()

    // 获取初始化后的角色列表
    const roles = await Role.find().sort({ createdAt: -1 })

    res.json({
      code: 0,
      message: '默认角色初始化成功',
      data: roles,
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '初始化默认角色失败',
      error: error.message,
    })
  }
})

// 删除角色
router.delete('/api/roles/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    // 检查是否为系统角色
    if (role.isSystem) {
      return res.status(403).json({
        code: 403,
        message: '系统角色不能删除',
      })
    }

    // 检查是否有用户使用该角色
    const usersWithRole = await User.find({ role: role.code })
    if (usersWithRole.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该角色下还有用户，不能删除',
      })
    }

    await Role.findByIdAndDelete(id)

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

// 获取角色菜单权限
router.get('/api/roles/:id/menus', authLogin, async (req, res) => {
  try {
    const { id } = req.params

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    // 获取角色关联的菜单详情
    let menus = []
    if (role.menuIds && role.menuIds.length > 0) {
      menus = await Menu.find({ _id: { $in: role.menuIds } }).sort({ order: 1, createdAt: -1 })
    }

    res.json({
      code: 0,
      message: '获取角色菜单权限成功',
      data: {
        roleId: role._id,
        roleName: role.name,
        menuIds: role.menuIds || [],
        menus: menus,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取角色菜单权限失败',
      error: error.message,
    })
  }
})

// 更新角色菜单权限
router.put('/api/roles/:id/menus', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const { menuIds } = req.body

    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
      })
    }

    // 验证菜单ID是否有效
    if (menuIds && Array.isArray(menuIds) && menuIds.length > 0) {
      const validMenuIds = menuIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      if (validMenuIds.length !== menuIds.length) {
        return res.status(400).json({
          code: 400,
          message: '包含无效的菜单ID',
        })
      }

      // 检查菜单是否存在
      const existingMenus = await Menu.find({ _id: { $in: validMenuIds } })
      if (existingMenus.length !== validMenuIds.length) {
        return res.status(400).json({
          code: 400,
          message: '部分菜单不存在',
        })
      }
    }

    // 更新菜单权限
    role.menuIds = menuIds || []
    await role.save()

    // 获取更新后的菜单详情
    let menus = []
    if (role.menuIds && role.menuIds.length > 0) {
      menus = await Menu.find({ _id: { $in: role.menuIds } }).sort({ order: 1, createdAt: -1 })
    }

    res.json({
      code: 0,
      message: '更新角色菜单权限成功',
      data: {
        roleId: role._id,
        roleName: role.name,
        menuIds: role.menuIds,
        menus: menus,
      },
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新角色菜单权限失败',
      error: error.message,
    })
  }
})

export default router
