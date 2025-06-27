#!/usr/bin/env node

/**
 * 测试运行脚本
 * 
 * 功能：
 * - 检查测试环境配置
 * - 运行测试并生成报告
 * - 显示测试结果摘要
 * 
 * 使用方法：
 * node scripts/run-tests.js [options]
 * 
 * 选项：
 * --watch    监听模式
 * --coverage 生成覆盖率报告
 * --ci       CI 环境模式
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log('\n' + '='.repeat(50), 'cyan')
  log(message, 'bright')
  log('='.repeat(50), 'cyan')
}

function logSection(message) {
  log('\n' + '-'.repeat(30), 'yellow')
  log(message, 'yellow')
  log('-'.repeat(30), 'yellow')
}

// 检查环境
function checkEnvironment() {
  logHeader('🔍 检查测试环境')
  
  // 检查 Node.js 版本
  const nodeVersion = process.version
  log(`Node.js 版本: ${nodeVersion}`, 'blue')
  
  // 检查 Jest 配置
  const jestConfigPath = path.join(process.cwd(), 'jest.config.js')
  if (fs.existsSync(jestConfigPath)) {
    log('✅ Jest 配置文件存在', 'green')
  } else {
    log('❌ Jest 配置文件不存在', 'red')
    process.exit(1)
  }
  
  // 检查测试目录
  const testDir = path.join(process.cwd(), 'src', 'tests')
  if (fs.existsSync(testDir)) {
    log('✅ 测试目录存在', 'green')
  } else {
    log('❌ 测试目录不存在', 'red')
    process.exit(1)
  }
  
  // 检查测试文件
  const testFiles = findTestFiles()
  log(`📁 发现 ${testFiles.length} 个测试文件`, 'blue')
  
  return testFiles
}

// 查找测试文件
function findTestFiles() {
  const testFiles = []
  const srcDir = path.join(process.cwd(), 'src')
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        walkDir(filePath)
      } else if (file.endsWith('.test.js') || file.endsWith('.spec.js')) {
        testFiles.push(filePath)
      }
    }
  }
  
  if (fs.existsSync(srcDir)) {
    walkDir(srcDir)
  }
  
  return testFiles
}

// 运行测试
function runTests(options = {}) {
  logHeader('🚀 运行测试')
  
  const args = ['npm', 'test']
  
  if (options.watch) {
    args.push('--', '--watch')
    log('👀 监听模式', 'yellow')
  }
  
  if (options.coverage) {
    args[1] = 'run'
    args[2] = 'test:coverage'
    log('📊 生成覆盖率报告', 'yellow')
  }
  
  if (options.ci) {
    args[1] = 'run'
    args[2] = 'test:ci'
    log('🏗️  CI 模式', 'yellow')
  }
  
  try {
    log(`执行命令: ${args.join(' ')}`, 'blue')
    execSync(args.join(' '), { stdio: 'inherit' })
    log('\n✅ 测试完成', 'green')
  } catch (error) {
    log('\n❌ 测试失败', 'red')
    process.exit(1)
  }
}

// 显示覆盖率报告
function showCoverageReport() {
  logHeader('📈 覆盖率报告')
  
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
  
  if (fs.existsSync(coveragePath)) {
    try {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
      const total = coverage.total
      
      log('总体覆盖率:', 'blue')
      log(`  语句: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`, 
          total.statements.pct >= 70 ? 'green' : 'red')
      log(`  分支: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`, 
          total.branches.pct >= 70 ? 'green' : 'red')
      log(`  函数: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`, 
          total.functions.pct >= 70 ? 'green' : 'red')
      log(`  行数: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`, 
          total.lines.pct >= 70 ? 'green' : 'red')
      
      // 检查是否达到阈值
      const thresholds = ['statements', 'branches', 'functions', 'lines']
      const failed = thresholds.filter(key => total[key].pct < 70)
      
      if (failed.length > 0) {
        log(`\n⚠️  以下指标未达到 70% 阈值: ${failed.join(', ')}`, 'yellow')
      } else {
        log('\n🎉 所有覆盖率指标都达到阈值!', 'green')
      }
      
    } catch (error) {
      log('❌ 无法读取覆盖率报告', 'red')
    }
  } else {
    log('❌ 覆盖率报告不存在，请先运行测试', 'red')
  }
}

// 显示测试文件统计
function showTestStats(testFiles) {
  logHeader('📋 测试文件统计')
  
  const stats = {
    models: 0,
    middleware: 0,
    routes: 0,
    utils: 0,
    other: 0
  }
  
  testFiles.forEach(file => {
    if (file.includes('/models/')) stats.models++
    else if (file.includes('/middleware/')) stats.middleware++
    else if (file.includes('/routes/')) stats.routes++
    else if (file.includes('/utils/')) stats.utils++
    else stats.other++
  })
  
  log('测试文件分布:', 'blue')
  log(`  模型测试: ${stats.models}`, 'cyan')
  log(`  中间件测试: ${stats.middleware}`, 'cyan')
  log(`  路由测试: ${stats.routes}`, 'cyan')
  log(`  工具函数测试: ${stats.utils}`, 'cyan')
  log(`  其他测试: ${stats.other}`, 'cyan')
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const options = {
    watch: args.includes('--watch'),
    coverage: args.includes('--coverage'),
    ci: args.includes('--ci')
  }
  
  log('🧪 Express Admin 测试运行器', 'bright')
  
  // 检查环境
  const testFiles = checkEnvironment()
  
  // 显示测试统计
  showTestStats(testFiles)
  
  // 运行测试
  runTests(options)
  
  // 显示覆盖率报告
  if (options.coverage || options.ci) {
    showCoverageReport()
  }
  
  logHeader('✨ 测试运行完成')
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
} 