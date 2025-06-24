/**
 * Docker 版 Ollama 本地 AI 模型设置脚本
 * 
 * 作用：
 * - 提供基于 Docker 的 Ollama 本地 AI 模型完整设置指南
 * - 检查系统环境（Docker、Docker Compose、NVIDIA GPU）
 * - 自动配置环境变量和 Docker 相关设置
 * - 提供容器化部署的完整操作流程
 * 
 * 使用方法：
 * npm run setup-ollama-docker
 * 
 * 系统要求：
 * - Docker 已安装并运行
 * - Docker Compose 已安装
 * - 可选：NVIDIA GPU 支持（用于加速）
 * 
 * 主要功能：
 * - 环境检查：Docker、Docker Compose、GPU 支持
 * - 自动配置：环境变量、Docker Compose 文件
 * - 服务管理：启动、停止、重启、日志查看
 * - 模型管理：下载、验证、切换模型
 * 
 * 优势：
 * - 隔离环境，不影响系统其他服务
 * - 易于部署和管理
 * - 支持 GPU 加速（如果可用）
 * - 资源使用可控
 * 
 * 注意事项：
 * - 需要足够的磁盘空间存储模型
 * - 首次启动需要下载 Docker 镜像
 * - GPU 模式需要 NVIDIA Docker 支持
 * - 建议分配足够的内存给 Docker
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🐳 开始设置 Docker 版 Ollama 本地 AI 模型...\n');

// 检查 Docker 是否安装
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    console.log('✅ Docker 已安装');
    return true;
  } catch (error) {
    console.log('❌ Docker 未安装');
    return false;
  }
}

// 检查 Docker Compose 是否安装
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'pipe' });
    console.log('✅ Docker Compose 已安装');
    return true;
  } catch (error) {
    try {
      execSync('docker compose version', { stdio: 'pipe' });
      console.log('✅ Docker Compose (新版本) 已安装');
      return true;
    } catch (error2) {
      console.log('❌ Docker Compose 未安装');
      return false;
    }
  }
}

// 检查 NVIDIA Docker 支持
function checkNvidiaDocker() {
  try {
    execSync('nvidia-smi', { stdio: 'pipe' });
    console.log('✅ NVIDIA GPU 可用');
    return true;
  } catch (error) {
    console.log('ℹ️  NVIDIA GPU 不可用，将使用 CPU 模式');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 检查系统环境...\n');
  
  const dockerInstalled = checkDocker();
  const dockerComposeInstalled = checkDockerCompose();
  const nvidiaAvailable = checkNvidiaDocker();
  
  if (!dockerInstalled) {
    console.log('\n📋 Docker 安装指南:');
    console.log('1. 访问 https://docs.docker.com/get-docker/ 下载 Docker');
    console.log('2. 安装完成后重启系统');
    console.log('3. 运行 docker --version 验证安装');
    return;
  }
  
  if (!dockerComposeInstalled) {
    console.log('\n📋 Docker Compose 安装指南:');
    console.log('1. Docker Desktop 通常已包含 Docker Compose');
    console.log('2. 或运行: pip install docker-compose');
    console.log('3. 运行 docker-compose --version 验证安装');
    return;
  }
  
  console.log('\n📥 推荐的模型:');
  const recommendedModels = [
    'qwen2.5:7b - 通义千问2.5 7B模型，中文效果好，资源占用适中'
  ];
  
  recommendedModels.forEach(model => console.log(`   • ${model}`));
  
  console.log('\n🚀 启动 Ollama 服务:');
  console.log('1. 启动 Ollama 容器:');
  console.log('   docker-compose -f docker-compose.ollama.yml up -d');
  console.log('\n2. 查看容器状态:');
  console.log('   docker-compose -f docker-compose.ollama.yml ps');
  console.log('\n3. 查看日志:');
  console.log('   docker-compose -f docker-compose.ollama.yml logs -f ollama');
  
  console.log('\n📥 下载模型:');
  console.log('1. 进入容器:');
  console.log('   docker exec -it ollama bash');
  console.log('\n2. 下载模型:');
  console.log('   ollama pull qwen2.5:7b');
  console.log('\n3. 验证模型:');
  console.log('   ollama list');
  
  console.log('\n🌐 访问服务:');
  console.log('• Ollama API: http://localhost:11434');
  console.log('• Ollama Web UI: http://localhost:3001');
  
  console.log('\n⚙️  环境变量配置:');
  console.log('在 .env 文件中添加以下配置:');
  console.log('OLLAMA_HOST=http://localhost:11434');
  console.log('OLLAMA_MODEL=qwen2.5:7b');
  
  // 检查 .env 文件是否存在
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('\n📝 更新 .env 文件...');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 检查是否已有 Ollama 配置
    if (!envContent.includes('OLLAMA_HOST')) {
      envContent += '\n# Ollama Docker 配置\nOLLAMA_HOST=http://localhost:11434\nOLLAMA_MODEL=qwen2.5:7b\n';
      fs.writeFileSync(envPath, envContent);
      console.log('✅ 已添加 Ollama 配置到 .env 文件');
    } else {
      console.log('ℹ️  .env 文件中已有 Ollama 配置');
    }
  } else {
    console.log('\n⚠️  未找到 .env 文件，请先运行 npm run setup-env');
  }
  
  console.log('\n🔍 故障排除:');
  console.log('• 如果容器启动失败，检查端口 11434 是否被占用');
  console.log('• 如果模型下载慢，可以配置镜像源');
  console.log('• 如果 GPU 不可用，容器会自动使用 CPU 模式');
  console.log('• 查看容器日志: docker logs ollama');
  
  console.log('\n📋 常用命令:');
  console.log('• 启动服务: docker-compose -f docker-compose.ollama.yml up -d');
  console.log('• 停止服务: docker-compose -f docker-compose.ollama.yml down');
  console.log('• 重启服务: docker-compose -f docker-compose.ollama.yml restart');
  console.log('• 查看日志: docker-compose -f docker-compose.ollama.yml logs -f');
  console.log('• 进入容器: docker exec -it ollama bash');
  console.log('• 删除数据: docker-compose -f docker-compose.ollama.yml down -v');
  
  console.log('\n✨ 设置完成！现在您可以开始使用 Docker 版本地 AI 模型了。');
}

main().catch(console.error); 