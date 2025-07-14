import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 兼容 Jest、Babel、Node 原生环境的 __filename/__dirname
let __filename, __dirname

if (process.env.NODE_ENV === 'test' || typeof import.meta === 'undefined') {
  __filename = path.resolve(process.cwd(), 'src/routes/main/pages.js')
  __dirname = path.resolve(process.cwd(), 'src/routes/main')
} else {
  __filename = fileURLToPath(import.meta.url)
  __dirname = dirname(__filename)
}

const router = express.Router()

export default router 