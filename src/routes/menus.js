import express from 'express'
import Menu from '../models/menu.js'
import Role from '../models/role.js'
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
    console.log(query)
    const total = await Menu.countDocuments(query)
    const menus = await Menu.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
    console.log(menus)
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

// 获取所有菜单（用于树形结构）x
router.get('/api/menus-tree', authLogin, async (req, res) => {
  try {
    const { status } = req.query
    const query = {}

    // 默认只返回启用状态的菜单，除非明确指定状态
    if (status) {
      query.status = status
    } else {
      query.status = 'active'
    }

    // 获取当前用户的角色信息
    const userRole = req.user.role
    console.log('用户角色:', userRole)

    // 所有用户（包括管理员）都根据角色权限获取菜单
    console.log('根据角色权限获取菜单')

    // 查找用户角色
    const role = await Role.findOne({ code: userRole, status: 'active' })
    if (!role) {
      return res.status(403).json({
        code: 403,
        message: '用户角色不存在或已被停用',
      })
    }

    console.log('用户角色信息:', role.name, '菜单权限数量:', role.menuIds?.length || 0)

    // 获取角色关联的菜单ID
    const menuIds = role.menuIds || []

    if (menuIds.length === 0) {
      // 如果角色没有分配任何菜单权限，返回空数组
      console.log('角色没有菜单权限')
      res.json({
        code: 0,
        message: '获取菜单树成功',
        data: [],
      })
      return
    }

    console.log('原始角色菜单ID:', menuIds)

    // 获取所有菜单用于权限计算
    const allMenus = await Menu.find(query).sort({ order: 1, createdAt: -1 })

    // 计算最终有权限的菜单ID
    const finalMenuIds = new Set(menuIds.map((id) => id.toString()))

    // 1. 如果选择了父菜单，自动添加所有子菜单
    for (const menuId of menuIds) {
      const menu = allMenus.find((m) => m._id.toString() === menuId.toString())
      if (menu) {
        // 递归添加所有子菜单
        const addChildren = (parentId) => {
          const children = allMenus.filter((m) => m.parentId && m.parentId.toString() === parentId.toString())
          for (const child of children) {
            finalMenuIds.add(child._id.toString())
            addChildren(child._id)
          }
        }
        addChildren(menu._id)
      }
    }

    // 2. 如果选择了子菜单，自动添加所有父菜单（但不添加其他子菜单）
    for (const menuId of menuIds) {
      const menu = allMenus.find((m) => m._id.toString() === menuId.toString())
      if (menu) {
        finalMenuIds.add(menu._id.toString()) // 加入当前菜单

        // 向上递归添加所有父菜单
        let current = menu
        while (current.parentId) {
          const parent = allMenus.find((m) => m._id.toString() === current.parentId.toString())
          if (parent) {
            finalMenuIds.add(parent._id.toString())
            current = parent
          } else {
            break
          }
        }
      }
    }

    const finalMenuIdsArray = Array.from(finalMenuIds)
    console.log('最终菜单ID（包含父菜单和子菜单）:', finalMenuIdsArray)

    // 根据最终权限获取菜单
    const menus = await Menu.find({
      ...query,
      _id: { $in: finalMenuIdsArray },
    }).sort({ order: 1, createdAt: -1 })

    console.log('根据权限获取的菜单数量:', menus.length)
    console.log(
      '菜单详情:',
      menus.map((m) => ({ id: m._id, label: m.label, parentId: m.parentId, status: m.status }))
    )

    // 构建树形结构 - 只包含有权限的菜单
    const buildTree = (items, parentId = null) => {
      const filteredItems = items.filter((item) => String(item.parentId) === String(parentId))
      console.log(
        `构建树形结构 - parentId: ${parentId}, 找到 ${filteredItems.length} 个菜单:`,
        filteredItems.map((item) => ({ id: item._id, label: item.label }))
      )

      return filteredItems.map((item) => ({
        ...item.toObject(),
        children: buildTree(items, item._id),
      }))
    }

    const treeData = buildTree(menus)
    console.log('最终菜单树:', treeData)

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
router.get('/api/menus-all', authLogin, async (req, res) => {
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
    console.log(treeData)

    res.json({
      code: 0,
      message: '获取所有菜单树成功',
      data: treeData,
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 初始化默认菜单
router.post('/api/menusInit', authLogin, async (req, res) => {
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

export default router
