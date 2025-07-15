#!/usr/bin/env node

import mongoose from 'mongoose'
import StatisticsService from '../src/services/statistics.js'
import User from '../src/models/user.js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 生成假统计数据
 */
async function generateFakeStatistics() {
  try {
    console.log('🚀 开始生成假统计数据...')
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ 数据库连接成功')
    
    // 检查是否有用户数据
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      console.log('⚠️  没有找到用户数据，将生成匿名用户数据')
    } else {
      console.log(`✅ 找到 ${userCount} 个用户`)
    }
    
    // 清理现有数据
    console.log('🧹 清理现有统计数据...')
    await StatisticsService.clearAllData()
    
    // 生成假数据
    console.log('📊 生成假统计数据...')
    const count = await StatisticsService.generateFakeData()
    
    console.log(`✅ 成功生成 ${count} 条假统计数据`)
    console.log('📈 现在可以测试统计功能了！')
    
    // 显示一些示例数据
    console.log('\n📋 示例数据预览:')
    const sampleData = await StatisticsService.getOverview()
    console.log('系统概览:', JSON.stringify(sampleData, null, 2))
    
  } catch (error) {
    console.error('❌ 生成假数据失败:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 数据库连接已关闭')
  }
}

// 运行脚本
generateFakeStatistics() 