import express from 'express'
import fs from 'fs'
import path from 'path'
import handleError from '../utils/handleError.js'

const router = express.Router()

const permissionsFile = path.join(process.cwd(), 'jsons', 'permissions.json')

// 获取权限列表
router.get('/api/permissions', (req, res) => {
  try {
    if (!fs.existsSync(permissionsFile)) {
      fs.writeFileSync(permissionsFile, '[]', 'utf-8')
    }
    const content = fs.readFileSync(permissionsFile, 'utf-8')
    res.json({
      code: 0,
      data: JSON.parse(content),
      message: '获取权限列表成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 新增权限
router.post('/api/permissions', (req, res) => {
  try {
    let permissions = []
    if (fs.existsSync(permissionsFile)) {
      permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf-8'))
    }
    const newPermission = req.body
    if (permissions.some((p) => p.name === newPermission.name)) {
      return res.status(400).json({
        code: 400,
        message: '权限已存在',
      })
    }
    permissions.push(newPermission)
    fs.writeFileSync(permissionsFile, JSON.stringify(permissions, null, 2), 'utf-8')
    res.json({
      code: 0,
      message: '新增权限成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

// 删除权限
router.delete('/api/permissions/:name', (req, res) => {
  try {
    let permissions = []
    if (fs.existsSync(permissionsFile)) {
      permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf-8'))
    }
    const name = req.params.name
    const newPermissions = permissions.filter((p) => p.name !== name)
    if (newPermissions.length === permissions.length) {
      return res.status(404).json({
        code: 404,
        message: '权限不存在',
      })
    }
    fs.writeFileSync(permissionsFile, JSON.stringify(newPermissions, null, 2), 'utf-8')
    res.json({
      code: 0,
      message: '删除权限成功',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

export default router
