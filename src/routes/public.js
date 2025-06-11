import express from 'express'
import fs from 'fs'
import path from 'path'
import handleError from '../utils/handleError'

const router = express.Router()

// 验证中间件
const validateAccess = (req, res, next) => {
  // TODO: 在这里添加验证逻辑
  // 例如：检查用户权限、验证token等
  next()
}

// WebSocket 测试页面
router.get('/websocket-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/websocket.html'))
})

// Pusher 测试页面
router.get('/pusher-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pusher-test.html'))
})

// 获取文件列表或文件内容
router.get('/api/public/:folder/:filename?', validateAccess, (req, res) => {
  try {
    const { folder, filename } = req.params
    const publicDir = path.join(process.cwd(), 'public')
    const targetPath = filename 
      ? path.join(publicDir, folder, filename)
      : path.join(publicDir, folder)

    // 检查路径是否存在
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        code: 404,
        message: '文件或目录不存在'
      })
    }

    // 获取文件状态
    const stats = fs.statSync(targetPath)

    // 如果是目录，返回目录内容
    if (stats.isDirectory()) {
      const files = fs.readdirSync(targetPath)
      const fileList = files.map(file => {
        const filePath = path.join(targetPath, file)
        const fileStats = fs.statSync(filePath)
        return {
          name: file,
          path: path.join(folder, filename || '', file).replace(/\\/g, '/'),
          isDirectory: fileStats.isDirectory(),
          size: fileStats.size,
          mtime: fileStats.mtime
        }
      })

      return res.json({
        code: 0,
        data: fileList,
        message: '获取文件列表成功'
      })
    }

    // 如果是文件，返回文件内容
    if (stats.isFile() && path.extname(targetPath) === '.json') {
      const content = fs.readFileSync(targetPath, 'utf-8')
      return res.json({
        code: 0,
        data: JSON.parse(content),
        message: '获取文件内容成功'
      })
    }

    // 如果不是 JSON 文件
    return res.status(400).json({
      code: 400,
      message: '只能访问 JSON 文件'
    })

  } catch (err) {
    handleError(err, req, res)
  }
})

export default router
