#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const MANUAL_TESTS_DIR = './tests/manual';

async function runManualTests() {
  console.log('🧪 开始运行手动测试...\n');

  try {
    // 获取所有手动测试文件
    const testFiles = readdirSync(MANUAL_TESTS_DIR)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log(`📁 找到 ${testFiles.length} 个手动测试文件:\n`);

    for (const file of testFiles) {
      console.log(`\n🔍 运行测试: ${file}`);
      console.log('─'.repeat(50));

      try {
        const filePath = join(MANUAL_TESTS_DIR, file);
        execSync(`babel-node ${filePath}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log(`✅ ${file} 测试完成`);
      } catch (error) {
        console.error(`❌ ${file} 测试失败:`, error.message);
      }

      console.log('─'.repeat(50));
    }

    console.log('\n🎉 所有手动测试运行完成！');

  } catch (error) {
    console.error('❌ 运行手动测试时出错:', error.message);
    process.exit(1);
  }
}

// 支持命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
手动测试运行器

用法:
  node scripts/run-manual-tests.js [选项]

选项:
  --help, -h    显示帮助信息
  --file <name>  运行指定的测试文件

示例:
  node scripts/run-manual-tests.js
  node scripts/run-manual-tests.js --file test-chat-request.js
  `);
  process.exit(0);
}

// 如果指定了特定文件
const fileIndex = args.indexOf('--file');
if (fileIndex !== -1 && args[fileIndex + 1]) {
  const specificFile = args[fileIndex + 1];
  console.log(`🧪 运行指定测试文件: ${specificFile}\n`);
  
  try {
    const filePath = join(MANUAL_TESTS_DIR, specificFile);
    execSync(`babel-node ${filePath}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n✅ ${specificFile} 测试完成`);
  } catch (error) {
    console.error(`❌ ${specificFile} 测试失败:`, error.message);
    process.exit(1);
  }
} else {
  // 运行所有手动测试
  runManualTests();
} 