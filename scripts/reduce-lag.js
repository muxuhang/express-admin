/**
 * 系统卡顿优化脚本
 * 
 * 作用：
 * - 诊断和优化 AI 使用时的系统卡顿问题
 * - 检查系统资源使用情况（CPU、内存、磁盘）
 * - 监控 Docker 容器资源分配
 * - 提供详细的优化建议和立即可执行的命令
 * 
 * 使用方法：
 * npm run reduce-lag
 * 
 * 诊断功能：
 * - 系统资源检查：内存、CPU、磁盘使用情况
 * - Docker 资源监控：容器 CPU、内存使用率
 * - 性能瓶颈识别：资源不足、配置不当
 * 
 * 优化建议：
 * - Docker Desktop 资源配置优化
 * - 系统应用管理建议
 * - 使用策略优化
 * - 技术参数调整
 * 
 * 立即可执行的命令：
 * - 重启 Ollama 容器
 * - 清理 Docker 缓存
 * - 查看容器日志
 * - 监控资源使用
 * - 清理对话历史
 * 
 * 紧急优化方案：
 * - 停止其他容器
 * - 重启 Docker Desktop
 * - 重启应用服务器
 * - 硬件升级建议
 * 
 * 注意事项：
 * - 需要管理员权限执行某些命令
 * - 优化效果取决于硬件配置
 * - 建议在系统空闲时运行优化
 * - 某些优化可能需要重启服务
 */

import { execSync } from 'child_process';

console.log('⚡ 开始优化系统以减少 AI 使用时的卡顿...\n');

// 检查系统资源
function checkSystemResources() {
  try {
    console.log('📊 系统资源检查:');
    
    // 检查内存使用
    const memoryInfo = execSync('top -l 1 -s 0 | grep PhysMem', { encoding: 'utf8' });
    console.log('内存使用情况:', memoryInfo.trim());
    
    // 检查 CPU 使用
    const cpuInfo = execSync('top -l 1 -s 0 | grep "CPU usage"', { encoding: 'utf8' });
    console.log('CPU 使用情况:', cpuInfo.trim());
    
    // 检查磁盘空间
    const diskInfo = execSync('df -h / | tail -1', { encoding: 'utf8' });
    console.log('磁盘使用情况:', diskInfo.trim());
    
  } catch (error) {
    console.log('❌ 无法获取系统资源信息');
  }
}

// 检查 Docker 资源分配
function checkDockerResources() {
  try {
    console.log('\n🐳 Docker 资源检查:');
    
    const containerStats = execSync('docker stats ollama --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"', { encoding: 'utf8' });
    console.log(containerStats);
    
  } catch (error) {
    console.log('❌ 无法获取 Docker 资源信息');
  }
}

// 提供优化建议
function provideOptimizationTips() {
  console.log('\n💡 减少卡顿的优化建议:');
  
  console.log('\n1. 🖥️  Docker Desktop 设置优化:');
  console.log('   - 打开 Docker Desktop');
  console.log('   - 进入 Settings > Resources');
  console.log('   - 内存: 建议分配 6-8GB');
  console.log('   - CPU: 建议分配 2-4 核');
  console.log('   - 磁盘: 确保有足够空间');
  
  console.log('\n2. 🔧 系统优化:');
  console.log('   - 关闭不必要的应用程序');
  console.log('   - 关闭浏览器多余标签页');
  console.log('   - 暂停其他开发工具');
  console.log('   - 关闭视频播放器、音乐播放器等');
  
  console.log('\n3. 📱 使用建议:');
  console.log('   - 在系统空闲时使用 AI');
  console.log('   - 避免同时运行多个 AI 对话');
  console.log('   - 定期清理对话历史');
  console.log('   - 重启 Docker 容器释放内存');
  
  console.log('\n4. ⚙️  技术优化:');
  console.log('   - 已配置更严格的资源限制');
  console.log('   - 已优化 AI 模型参数');
  console.log('   - 已减少最大生成长度');
  console.log('   - 已调整上下文长度');
}

// 提供立即可执行的命令
function provideImmediateActions() {
  console.log('\n🚀 立即可执行的优化命令:');
  console.log('• 重启 Ollama 容器: docker-compose restart ollama');
  console.log('• 清理 Docker 缓存: docker system prune -f');
  console.log('• 查看容器日志: docker logs -f ollama');
  console.log('• 监控资源使用: docker stats ollama');
  console.log('• 清理对话历史: 通过 API 调用 /api/chat/history DELETE');
}

// 提供紧急优化方案
function provideEmergencyOptimizations() {
  console.log('\n🚨 紧急优化方案（如果仍然卡顿）:');
  console.log('1. 停止其他 Docker 容器: docker stop $(docker ps -q)');
  console.log('2. 重启 Docker Desktop');
  console.log('3. 重启应用服务器');
  console.log('4. 考虑使用更小的模型（需要重新下载）');
  console.log('5. 增加系统内存或使用 SSD 存储');
}

// 主函数
async function main() {
  console.log('🔍 检查当前状态...\n');
  
  checkSystemResources();
  checkDockerResources();
  
  provideOptimizationTips();
  provideImmediateActions();
  provideEmergencyOptimizations();
  
  console.log('\n✨ 优化建议已提供！请根据建议调整系统设置。');
  console.log('如果问题持续存在，请考虑升级硬件配置。');
}

main().catch(console.error); 