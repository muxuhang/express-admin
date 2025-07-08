import mongoose from 'mongoose'

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['article', 'news', 'announcement', 'tutorial'],
    default: 'article'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  author: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'offline', 'pending'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  coverImage: {
    type: String,
    default: null
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 更新时自动更新 updatedAt 字段
ArticleSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

// 发布文章时自动设置 publishedAt
ArticleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now()
  }
  next()
})

// 创建索引
ArticleSchema.index({ title: 'text', content: 'text' })
ArticleSchema.index({ status: 1, publishedAt: -1 })
ArticleSchema.index({ category: 1, status: 1 })
ArticleSchema.index({ author: 1, createdAt: -1 })

// 检查模型是否已经存在
const Article = mongoose.models.Article || mongoose.model('Article', ArticleSchema)

export default Article 