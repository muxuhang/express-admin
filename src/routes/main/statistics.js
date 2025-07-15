import express from 'express'
import { body, query, validationResult, param } from 'express-validator'
import StatisticsService from '../../services/statistics.js'
import { verifyToken, checkRole } from '../../utils/auth.js'

const router = express.Router()

/**
 * 获取系统总体统计
 * GET /api/statistics/system
 */
router.get(
  '/api/statistics/system',
  verifyToken,
  checkRole(['admin']),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 1,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { startDate, endDate } = req.query
      const stats = await StatisticsService.getSystemStats(startDate, endDate)
      
      res.json({
        code: 0,
        message: '获取系统统计成功',
        data: stats
      })
    } catch (error) {
      console.error('获取系统统计失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取系统统计失败',
        error: error.message
      })
    }
  }
)

/**
 * 获取单个用户统计
 * GET /api/statistics/user/:userId
 */
router.get(
  '/api/statistics/user/:userId',
  verifyToken,
  checkRole(['admin']),
  [
    param('userId').isMongoId().withMessage('用户ID格式不正确'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 1,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { userId } = req.params
      const { startDate, endDate } = req.query
      const stats = await StatisticsService.getUserStats(userId, startDate, endDate)
      
      res.json({
        code: 0,
        message: '获取用户统计成功',
        data: stats
      })
    } catch (error) {
      console.error('获取用户统计失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取用户统计失败',
        error: error.message
      })
    }
  }
)

/**
 * 获取当前用户统计
 * GET /api/statistics/my-stats
 */
router.get(
  '/api/statistics/my-stats',
  verifyToken,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 1,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { startDate, endDate } = req.query
      const userId = req.user._id
      const stats = await StatisticsService.getUserStats(userId, startDate, endDate)
      
      res.json({
        code: 0,
        message: '获取当前用户统计成功',
        data: stats
      })
    } catch (error) {
      console.error('获取当前用户统计失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取当前用户统计失败',
        error: error.message
      })
    }
  }
)

/**
 * 获取热门页面
 * GET /api/statistics/popular-pages
 */
router.get(
  '/api/statistics/popular-pages',
  verifyToken,
  checkRole(['admin']),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 1,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { startDate, endDate, page = 1, limit = 10 } = req.query
      const pages = await StatisticsService.getPopularPages(startDate, endDate, page, limit)
      
      res.json({
        code: 0,
        message: '获取热门页面成功',
        data: {
          total: pages.total,
          page: parseInt(page),
          limit: parseInt(limit),
          list: pages.list
        }
      })
    } catch (error) {
      console.error('获取热门页面失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取热门页面失败',
        error: error.message
      })
    }
  }
)

/**
 * 获取API性能统计
 * GET /api/statistics/api-performance
 */
router.get(
  '/api/statistics/api-performance',
  verifyToken,
  checkRole(['admin']),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('avgResponseTime').optional().isIn(['asc', 'desc', 'ascend', 'descend']).withMessage('avgResponseTime排序方向必须是: asc, desc, ascend, descend'),
    query('count').optional().isIn(['asc', 'desc', 'ascend', 'descend']).withMessage('count排序方向必须是: asc, desc, ascend, descend'),
    query('errorCount').optional().isIn(['asc', 'desc', 'ascend', 'descend']).withMessage('errorCount排序方向必须是: asc, desc, ascend, descend'),
    query('errorRate').optional().isIn(['asc', 'desc', 'ascend', 'descend']).withMessage('errorRate排序方向必须是: asc, desc, ascend, descend'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 1,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10,
        avgResponseTime,
        count,
        errorCount,
        errorRate
      } = req.query
      
      // 确定排序参数
      let sortParam = null
      if (avgResponseTime) {
        sortParam = `avgResponseTime=${avgResponseTime}`
      } else if (count) {
        sortParam = `count=${count}`
      } else if (errorCount) {
        sortParam = `errorCount=${errorCount}`
      } else if (errorRate) {
        sortParam = `errorRate=${errorRate}`
      }
      
      const performance = await StatisticsService.getApiPerformance(
        startDate, 
        endDate, 
        page, 
        limit, 
        sortParam
      )
      
      res.json({
        code: 0,
        message: '获取API性能统计成功',
        data: {
          total: performance.total,
          page: parseInt(page),
          limit: parseInt(limit),
          sortParam,
          list: performance.list
        }
      })
    } catch (error) {
      console.error('获取API性能统计失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取API性能统计失败',
        error: error.message
      })
    }
  }
)

/**
 * 获取实时统计
 * GET /api/statistics/realtime
 */
router.get(
  '/api/statistics/realtime',
  verifyToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const realtime = await StatisticsService.getRealTimeStats()
      
      res.json({
        code: 0,
        message: '获取实时统计成功',
        data: realtime
      })
    } catch (error) {
      console.error('获取实时统计失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取实时统计失败',
        error: error.message
      })
    }
  }
)

/**
 * 清理旧数据
 * POST /api/statistics/cleanup
 */
router.post(
  '/api/statistics/cleanup',
  verifyToken,
  checkRole(['admin']),
  [body('daysToKeep').optional().isInt({ min: 1, max: 365 }).withMessage('保留天数必须在1-365之间')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { daysToKeep = 90 } = req.body
      const deletedCount = await StatisticsService.cleanupOldData(daysToKeep)

      res.json({
        success: true,
        message: `成功清理了 ${deletedCount} 条旧统计数据`,
        data: { deletedCount },
      })
    } catch (error) {
      console.error('清理旧数据失败:', error)
      res.status(500).json({
        success: false,
        message: '清理旧数据失败',
        error: error.message,
      })
    }
  }
)

/**
 * 获取统计概览
 * GET /api/statistics/overview
 */
router.get(
  '/api/statistics/overview',
  verifyToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const overview = await StatisticsService.getOverview()
      
      res.json({
        code: 0,
        message: '获取统计概览成功',
        data: overview
      })
    } catch (error) {
      console.error('获取统计概览失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取统计概览失败',
        error: error.message
      })
    }
  }
)

/**
 * 获取用户统计列表
 * GET /api/statistics/users
 */
router.get(
  '/api/statistics/users',
  verifyToken,
  checkRole(['admin']),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 1,
          message: '参数验证失败',
          errors: errors.array(),
        })
      }

      const { startDate, endDate, page = 1, limit = 10 } = req.query
      const stats = await StatisticsService.getUsersStatsList(startDate, endDate, page, limit)
      
      res.json({
        code: 0,
        message: '获取用户统计列表成功',
        data: {
          total: stats.total,
          page: parseInt(page),
          limit: parseInt(limit),
          list: stats.list
        }
      })
    } catch (error) {
      console.error('获取用户统计列表失败:', error)
      res.status(500).json({
        code: 1,
        message: '获取用户统计列表失败',
        error: error.message
      })
    }
  }
)

/**
 * 生成假数据
 * POST /api/statistics/generate-fake-data
 */
router.post(
  '/api/statistics/generate-fake-data',
  verifyToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const count = await StatisticsService.generateFakeData()
      
      res.json({
        code: 0,
        message: `成功生成 ${count} 条假数据`,
        data: { count }
      })
    } catch (error) {
      console.error('生成假数据失败:', error)
      res.status(500).json({
        code: 1,
        message: '生成假数据失败',
        error: error.message
      })
    }
  }
)

/**
 * 清理所有统计数据
 * DELETE /api/statistics/clear-all
 */
router.delete(
  '/api/statistics/clear-all',
  verifyToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const count = await StatisticsService.clearAllData()
      
      res.json({
        code: 0,
        message: `成功清理 ${count} 条统计数据`,
        data: { count }
      })
    } catch (error) {
      console.error('清理统计数据失败:', error)
      res.status(500).json({
        code: 1,
        message: '清理统计数据失败',
        error: error.message
      })
    }
  }
)

export default router
