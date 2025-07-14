import express from 'express'
import fs from 'fs'
import path from 'path'
import handleError from '../../utils/handleError.js'

const router = express.Router()

// 获取文件列表或文件内容
router.get('/api/public/:folder/:filename?', (req, res) => {
  try {
    const { folder, filename } = req.params
    const { page = 1, limit = 10 } = req.query
    const publicDir = path.join(process.cwd(), 'public')
    const targetPath = filename ? path.join(publicDir, folder, filename) : path.join(publicDir, folder)

    // 检查路径是否存在
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        code: 404,
        message: '文件或目录不存在',
      })
    }

    // 获取文件状态
    const stats = fs.statSync(targetPath)

    // 如果是目录，返回目录内容
    if (stats.isDirectory()) {
      const files = fs.readdirSync(targetPath)
      const allFileList = files.map((file) => {
        const filePath = path.join(targetPath, file)
        const fileStats = fs.statSync(filePath)
        return {
          name: file,
          path: path.join(folder, filename || '', file).replace(/\\/g, '/'),
          isDirectory: fileStats.isDirectory(),
          size: fileStats.size,
          mtime: fileStats.mtime,
        }
      })

      // 计算分页
      const total = allFileList.length
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + parseInt(limit)
      const fileList = allFileList.slice(startIndex, endIndex)

      return res.json({
        code: 0,
        data: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          list: fileList,
        },
        message: '获取文件列表成功',
      })
    }

    // 如果是文件，返回文件内容
    if (stats.isFile() && path.extname(targetPath) === '.json') {
      const content = fs.readFileSync(targetPath, 'utf-8')
      return res.json({
        code: 0,
        data: JSON.parse(content),
        message: '获取文件内容成功',
      })
    }

    // 如果不是 JSON 文件
    return res.status(400).json({
      code: 400,
      message: '只能访问 JSON 文件',
    })
  } catch (err) {
    handleError(err, req, res)
  }
})

export default router
