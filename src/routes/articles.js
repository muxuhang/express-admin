import express from 'express'
import Article from '../models/article.js'
import handleError from '../utils/handleError.js'
import authLogin from '../middleware/authLogin.js'

const router = express.Router()

// 数据预处理函数
const preprocessArticleData = async (articleData, currentUser) => {
  // 处理 author 字段
  if (articleData.author) {
    // 如果传递的是字符串，直接使用
    if (typeof articleData.author === 'string') {
      // 保持字符串格式，不转换为 ObjectId
    } else {
      // 如果是其他格式，设置为当前用户名
      articleData.author = currentUser.username || currentUser._id
    }
  } else {
    // 如果没有传递作者，设置为当前用户名
    articleData.author = currentUser.username || currentUser._id
  }

  // 处理 category 字段（文章类型）
  if (articleData.category) {
    const validTypes = ['article', 'news', 'announcement', 'tutorial']
    if (!validTypes.includes(articleData.category)) {
      throw new Error(`文章类型 "${articleData.category}" 无效，必须是 ${validTypes.join(', ')} 中的一个`)
    }
  }

  // 处理 tags 字段
  if (articleData.tags) {
    // 如果 tags 是字符串，尝试解析为数组
    if (typeof articleData.tags === 'string') {
      try {
        // 尝试解析 JSON 字符串
        articleData.tags = JSON.parse(articleData.tags)
      } catch (e) {
        // 如果解析失败，设置为空数组
        articleData.tags = []
      }
    }
    
    // 确保 tags 是数组
    if (!Array.isArray(articleData.tags)) {
      articleData.tags = []
    }
    
    // 过滤和清理标签
    articleData.tags = articleData.tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim().substring(0, 30)) // 限制长度
  } else {
    articleData.tags = []
  }

  return articleData
}

// 获取文章列表
router.get('/api/articles', authLogin, async (req, res) => {
  try {
    const { keyword, status, type, category, page = 1, limit = 10 } = req.query
    const query = {}

    if (keyword) {
      query.$or = [
        { title: new RegExp(keyword, 'i') },
        { content: new RegExp(keyword, 'i') },
        { summary: new RegExp(keyword, 'i') },
      ]
    }

    if (status) {
      query.status = status
    }

    if (type) {
      query.type = type
    }

    if (category) {
      query.category = category
    }

    const total = await Article.countDocuments(query)
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      code: 0,
      message: '获取文章列表成功',
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list: articles,
      },
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取文章详情
router.get('/api/articles/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const article = await Article.findById(id)

    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' })
    }

    res.json({ code: 0, message: '获取文章信息成功', data: article })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 创建新文章
router.post('/api/articles', authLogin, async (req, res) => {
  try {
    const articleData = req.body
    const currentUser = req.user

    // 验证必需字段
    if (!articleData.title) {
      return res.status(400).json({ code: 400, message: '标题不能为空' })
    }
    if (!articleData.content) {
      return res.status(400).json({ code: 400, message: '内容不能为空' })
    }

    // 预处理文章数据
    const processedData = await preprocessArticleData(articleData, currentUser)

    // 如果状态为发布，设置发布时间
    if (processedData.status === 'published' && !processedData.publishedAt) {
      processedData.publishedAt = new Date()
    }

    const article = new Article(processedData)
    await article.save()

    // 返回创建的文章（包含关联数据）
    const createdArticle = await Article.findById(article._id)

    res.json({ code: 0, message: '创建文章成功', data: createdArticle })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 修改文章信息
router.put('/api/articles/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const articleData = req.body

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' })
    }

    // 验证必需字段
    if (!articleData.title) {
      return res.status(400).json({ code: 400, message: '标题不能为空' })
    }
    if (!articleData.content) {
      return res.status(400).json({ code: 400, message: '内容不能为空' })
    }

    // 预处理文章数据
    const processedData = await preprocessArticleData(articleData, req.user)

    // 确保不会修改作者
    delete processedData.author

    // 如果状态从非发布改为发布，设置发布时间
    if (processedData.status === 'published' && article.status !== 'published' && !processedData.publishedAt) {
      processedData.publishedAt = new Date()
    }

    Object.assign(article, processedData)
    await article.save()

    // 返回更新后的文章（包含关联数据）
    const updatedArticle = await Article.findById(id)

    res.json({ code: 0, message: '更新文章成功', data: updatedArticle })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 删除文章
router.delete('/api/articles/:id', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const currentUser = req.user

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' })
    }

    // 只有作者或管理员可以删除文章
    if (article.author !== currentUser.username && currentUser.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '没有权限删除此文章' })
    }

    await article.deleteOne()
    res.json({ code: 0, message: '删除文章成功' })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 更新文章状态
router.patch('/api/articles/:id/status', authLogin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' })
    }

    article.status = status
    
    // 如果状态改为发布，设置发布时间
    if (status === 'published' && !article.publishedAt) {
      article.publishedAt = new Date()
    }

    await article.save()

    res.json({ code: 0, message: '更新文章状态成功', data: article })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 增加文章浏览量
router.post('/api/articles/:id/view', async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' })
    }

    article.viewCount += 1
    await article.save()

    res.json({ code: 0, message: '更新浏览量成功', data: { viewCount: article.viewCount } })
  } catch (error) {
    handleError(error, req, res)
  }
})

// 获取文章统计信息
router.get('/api/articles-stats', authLogin, async (req, res) => {
  try {
    const stats = await Article.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const totalArticles = await Article.countDocuments()
    const publishedArticles = await Article.countDocuments({ status: 'published' })
    const draftArticles = await Article.countDocuments({ status: 'draft' })

    res.json({
      code: 0,
      message: '获取文章统计成功',
      data: {
        total: totalArticles,
        published: publishedArticles,
        draft: draftArticles,
        statusBreakdown: stats
      }
    })
  } catch (error) {
    handleError(error, req, res)
  }
})

export default router 