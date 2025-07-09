/**
 * 项目一键启动脚本
 * 
 * 作用：
 * - 自动化项目启动流程，包括环境检查、服务启动和应用运行
 * - 检查并创建必要的配置文件
 * - 启动 Docker 容器服务（包括 Ollama AI 模型）
 * - 启动 Express 应用服务器
 * 
 * 使用方法：
 * npm run start-project
 * 
 * 启动流程：
 * 1. 环境检查：Docker 安装状态
 * 2. 配置检查：.env 文件存在性
 * 3. 服务启动：Docker Compose 服务
 * 4. 模型检查：Ollama AI 模型状态
 * 5. 应用启动：Express 服务器
 * 
 * 依赖服务：
 * - Docker Desktop 运行中
 * - docker-compose.yml 配置正确
 * - 必要的环境变量已配置
 * 
 * 启动的服务：
 * - Ollama AI 模型容器
 * - 其他 Docker 服务（如果有）
 * - Express 应用服务器（端口 3000）
 * 
 * 注意事项：
 * - 首次运行可能需要下载 Docker 镜像
 * - AI 模型首次使用时会自动下载
 * - 确保端口 3000 和 11434 未被占用
 * - 建议在启动前关闭其他占用资源的应用
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 开始启动项目...\n');

// 检查 .env 文件
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 创建 .env 文件...');
    execSync('npm run setup-env', { stdio: 'inherit' });
  } else {
    console.log('✅ .env 文件已存在');
  }
}

// 检查 Docker 是否运行
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    console.log('✅ Docker 已安装');
    return true;
  } catch (error) {
    console.log('❌ Docker 未安装或未运行');
    console.log('请先安装并启动 Docker Desktop');
    return false;
  }
}

// 启动 Docker 服务
function startDockerServices() {
  try {
    console.log('🐳 启动 Docker 服务...');
    execSync('docker-compose up -d', { stdio: 'inherit' });
    console.log('✅ Docker 服务启动成功');
    return true;
  } catch (error) {
    console.log('❌ Docker 服务启动失败:', error.message);
    return false;
  }
}

// 检查 Ollama 模型
function checkOllamaModel() {
  try {
    console.log('🤖 检查 Ollama 模型...');
    const output = execSync('docker exec ollama ollama list', { encoding: 'utf8' });
    if (output.includes('llama3.2:3b')) {
      console.log('✅ 模型已安装');
      return true;
    } else {
      console.log('⚠️  模型未安装，将在首次使用时自动下载');
      return false;
    }
  } catch (error) {
    console.log('⚠️  无法检查模型状态，将在首次使用时自动下载');
    return false;
  }
}

// 启动应用服务器
function startApplication() {
  try {
    console.log('📱 启动应用服务器...');
    console.log('应用将在 http://localhost:3000 启动');
    console.log('按 Ctrl+C 停止服务器\n');
    execSync('npm start', { stdio: 'inherit' });
  } catch (error) {
    console.log('❌ 应用启动失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🔍 检查环境...\n');
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  checkEnvFile();
  
  console.log('\n🐳 启动 Docker 服务...\n');
  if (!startDockerServices()) {
    process.exit(1);
  }
  
  // 等待服务启动
  console.log('\n⏳ 等待服务启动...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  checkOllamaModel();
  
  console.log('\n🎯 启动应用服务器...\n');
  startApplication();
}

main().catch(console.error); 