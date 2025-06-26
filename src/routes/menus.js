import express from 'express'
import Menu from '../models/menu.js'
import handleError from '../utils/handleError.js'
import authLogin from '../middleware/authLogin.js'

const router = express.Router()

// 获取菜单列表
router.get('/api/menus', authLogin, async (req, res) => {
  try {
    const { keyword, status, page = 1, limit = 10 } = req.query
    const query = {}

    if (keyword) {
      query.$or = [
        { label: new RegExp(keyword, 'i') },
        { key: new RegExp(keyword, 'i') },
        { path: new RegExp(keyword, 'i') },
      ]
    }

    if (status) {
      query.status = status
    }

    const total = await Menu.countDocuments(query)
    const menus = await Menu.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      code: 0,
      message: '获取菜单列表成功',
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: menus,
      },
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取所有菜单（用于树形结构）
router.get('/api/menus/tree', authLogin, async (req, res) => {
  try {
    const { status } = req.query
    const query = {}

    // 默认只返回启用状态的菜单，除非明确指定状态
    if (status) {
      query.status = status
    } else {
      query.status = 'active'
    }

    const menus = await Menu.find(query).sort({ order: 1, createdAt: -1 })

    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter((item) => String(item.parentId) === String(parentId))
        .map((item) => ({
          ...item.toObject(),
          children: buildTree(items, item._id),
        }))
    }

    const treeData = buildTree(menus)

    res.json({
      code: 0,
      message: '获取菜单树成功',
      data: treeData,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取所有菜单（用于管理页面，包括禁用状态）
router.get('/api/menus/all', authLogin, async (req, res) => {
  try {
    const menus = await Menu.find().sort({ order: 1, createdAt: -1 })

    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter((item) => String(item.parentId) === String(parentId))
        .map((item) => ({
          ...item.toObject(),
          children: buildTree(items, item._id),
        }))
    }

    const treeData = buildTree(menus)

    res.json({
      code: 0,
      message: '获取所有菜单树成功',
      data: treeData,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 批量更新菜单排序
router.patch('/api/menus/order', authLogin, async (req, res) => {
  try {
    const { orders } = req.body

    if (!Array.isArray(orders)) {
      return res.status(400).json({ code: 400, message: '排序数据格式错误' })
    }

    for (const item of orders) {
      if (item.id && typeof item.order === 'number') {
        await Menu.findByIdAndUpdate(item.id, { order: item.order })
      }
    }

    res.json({ code: 0, message: '更新菜单排序成功' })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 初始化默认菜单
router.post('/api/menus/init', authLogin, async (req, res) => {
  try {
    // 检查当前用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以初始化默认菜单' })
    }

    await Menu.initDefaultMenus()

    // 获取初始化后的菜单列表
    const menus = await Menu.find().sort({ order: 1, createdAt: -1 })

    res.json({
      code: 0,
      message: '默认菜单初始化成功',
      data: menus,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 查看菜单详情
router.get('/api/menus/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const menu = await Menu.findById(id)
    if (!menu) {
      return res.status(404).json({ code: 404, message: '菜单不存在' })
    }
    res.json({ code: 0, message: '获取菜单信息成功', data: menu })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 创建新菜单
router.post('/api/menus', authLogin, async (req, res) => {
  try {
    const menuData = req.body

    // 处理 parentId：如果为空字符串、null 或 undefined，则设为 null（顶级菜单）
    if (menuData.parentId === '' || menuData.parentId === null || menuData.parentId === undefined) {
      menuData.parentId = null
    } else {
      // 检查父菜单是否存在
      const parentMenu = await Menu.findById(menuData.parentId)
      if (!parentMenu) {
        return res.status(400).json({ code: 400, message: '父菜单不存在' })
      }
    }

    const menu = new Menu(menuData)
    await menu.save()

    const savedMenu = await Menu.findById(menu._id)
    res.json({ code: 0, message: '创建菜单成功', data: savedMenu })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 修改菜单信息
router.put('/api/menus/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const menuData = req.body

    // 处理 parentId：如果为空字符串、null 或 undefined，则设为 null（顶级菜单）
    if (menuData.parentId === '' || menuData.parentId === null || menuData.parentId === undefined) {
      menuData.parentId = null
    } else {
      // 检查父菜单是否存在
      const parentMenu = await Menu.findById(menuData.parentId)
      if (!parentMenu) {
        return res.status(400).json({ code: 400, message: '父菜单不存在' })
      }

      // 防止自己成为自己的父菜单
      if (String(menuData.parentId) === String(id)) {
        return res.status(400).json({ code: 400, message: '不能将自己设为父菜单' })
      }
    }

    const menu = await Menu.findById(id)
    if (!menu) {
      return res.status(404).json({ code: 404, message: '菜单不存在' })
    }

    Object.assign(menu, menuData)
    await menu.save()

    const updatedMenu = await Menu.findById(id)
    res.json({ code: 0, message: '更新菜单成功', data: updatedMenu })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 删除菜单
router.delete('/api/menus/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const menu = await Menu.findById(id)
    if (!menu) {
      return res.status(404).json({ code: 404, message: '菜单不存在' })
    }

    // 检查是否有子菜单
    const childMenus = await Menu.find({ parentId: id })
    if (childMenus.length > 0) {
      return res.status(400).json({ code: 400, message: '该菜单下有子菜单，无法删除' })
    }

    await menu.deleteOne()
    res.json({ code: 0, message: '删除菜单成功' })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 启用/停用菜单
router.patch('/api/menus/:id/status', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效' })
    }

    const menu = await Menu.findById(id)
    if (!menu) {
      return res.status(404).json({ code: 404, message: '菜单不存在' })
    }

    menu.status = status
    await menu.save()

    const updatedMenu = await Menu.findById(id)
    res.json({
      code: 0,
      message: `菜单${status === 'active' ? '启用' : '停用'}成功`,
      data: updatedMenu,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router
