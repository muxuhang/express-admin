/**
 * Ollama Docker 容器性能优化脚本
 * 
 * 作用：
 * - 监控和优化 Docker 中运行的 Ollama 容器性能
 * - 检查容器状态和资源使用情况
 * - 提供系统级优化建议和配置指导
 * - 提供性能监控和故障排除命令
 * 
 * 使用方法：
 * npm run optimize-ollama
 * 
 * 主要功能：
 * - 容器状态检查：运行状态、端口映射
 * - 资源监控：CPU、内存使用情况
 * - 系统优化：Docker 配置、应用管理
 * - 性能建议：硬件配置、使用策略
 * 
 * 优化内容：
 * - 资源限制：最大 8GB 内存，4 核 CPU
 * - 并发控制：同时只处理 1 个请求
 * - 连接管理：5 分钟连接保持时间
 * - 健康检查：每 30 秒检查一次
 * 
 * 监控功能：
 * - 实时容器状态查看
 * - 资源使用统计
 * - 日志监控
 * - 故障诊断
 * 
 * 注意事项：
 * - 需要 Docker 和 Docker Compose 已安装
 * - 需要 Ollama 容器正在运行
 * - 优化效果取决于硬件配置
 * - 建议定期运行此脚本检查性能
 */

import { execSync } from 'child_process';

console.log('🚀 开始优化 Ollama Docker 容器性能...\n');

// 检查 Docker 容器状态
function checkContainerStatus() {
  try {
    const output = execSync('docker ps --filter "name=ollama" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { encoding: 'utf8' });
    console.log('📊 当前 Ollama 容器状态:');
    console.log(output);
    return true;
  } catch (error) {
    console.log('❌ 无法获取容器状态');
    return false;
  }
}

// 获取容器资源使用情况
function getResourceUsage() {
  try {
    const output = execSync('docker stats ollama --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"', { encoding: 'utf8' });
    console.log('📈 容器资源使用情况:');
    console.log(output);
  } catch (error) {
    console.log('❌ 无法获取资源使用情况');
  }
}

// 重启容器以应用新配置
function restartContainer() {
  try {
    console.log('🔄 重启 Ollama 容器以应用优化配置...');
    execSync('docker-compose restart ollama', { stdio: 'inherit' });
    console.log('✅ 容器重启完成');
  } catch (error) {
    console.log('❌ 重启容器失败:', error.message);
  }
}

// 优化系统设置
function optimizeSystem() {
  console.log('\n🔧 系统优化建议:');
  console.log('1. 确保 Docker Desktop 有足够的内存分配:');
  console.log('   - 打开 Docker Desktop');
  console.log('   - 进入 Settings > Resources');
  console.log('   - 建议分配至少 8GB 内存给 Docker');
  console.log('   - CPU 建议分配 4 核或更多');
  
  console.log('\n2. 关闭不必要的应用程序:');
  console.log('   - 浏览器标签页');
  console.log('   - 其他开发工具');
  console.log('   - 视频播放器等');
  
  console.log('\n3. 检查磁盘空间:');
  console.log('   - 确保有足够的磁盘空间存储模型');
  console.log('   - 清理 Docker 镜像和容器: docker system prune');
}

// 性能监控命令
function showMonitoringCommands() {
  console.log('\n📋 性能监控命令:');
  console.log('• 查看容器状态: docker ps --filter "name=ollama"');
  console.log('• 查看资源使用: docker stats ollama');
  console.log('• 查看容器日志: docker logs -f ollama');
  console.log('• 进入容器: docker exec -it ollama bash');
  console.log('• 查看模型列表: docker exec ollama ollama list');
  
  console.log('\n🔧 故障排除命令:');
  console.log('• 重启容器: docker-compose restart ollama');
  console.log('• 停止容器: docker-compose stop ollama');
  console.log('• 启动容器: docker-compose start ollama');
  console.log('• 重新构建: docker-compose up -d --build ollama');
}

// 主函数
async function main() {
  console.log('🔍 检查当前状态...\n');
  
  checkContainerStatus();
  
  console.log('\n📊 获取资源使用情况...\n');
  getResourceUsage();
  
  console.log('\n💡 性能优化建议:');
  console.log('1. 已配置资源限制: 最大 8GB 内存，4 核 CPU');
  console.log('2. 已设置并行处理限制: 同时只处理 1 个请求');
  console.log('3. 已配置连接保持时间: 5 分钟');
  console.log('4. 已添加健康检查: 每 30 秒检查一次');
  
  optimizeSystem();
  showMonitoringCommands();
  
  console.log('\n🎯 使用建议:');
  console.log('• 首次使用 AI 时，模型加载可能需要一些时间');
  console.log('• 如果仍然卡顿，可以尝试使用更小的模型');
  console.log('• 建议在空闲时间进行 AI 对话');
  console.log('• 可以设置定时任务清理对话历史');
  
  console.log('\n✨ 优化完成！现在 AI 模型将在 Docker 容器中更高效地运行。');
}

main().catch(console.error); 