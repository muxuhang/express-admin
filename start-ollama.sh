#!/bin/bash

echo "🤖 启动 Ollama 服务..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 停止现有ollama容器
echo "🛑 停止现有 Ollama 容器..."
docker-compose -f docker-compose.yml stop ollama 2>/dev/null || true

# 启动ollama服务
echo "🔨 启动 Ollama 服务..."
docker-compose -f docker-compose.yml up -d ollama

# 等待服务启动
echo "⏳ 等待 Ollama 服务启动..."
sleep 10

# 检查服务状态
echo "📊 Ollama 服务状态："
docker-compose -f docker-compose.yml ps ollama

echo ""
echo "✅ Ollama 服务启动完成！"
echo ""
echo "🌐 访问地址："
echo "   Ollama API: http://localhost:11434"
echo "   Ollama Web UI: http://localhost:11434 (如果支持)"
echo ""
echo "📝 查看日志："
echo "   docker-compose -f docker-compose.yml logs -f ollama"
echo ""
echo "🛑 停止服务："
echo "   docker-compose -f docker-compose.yml stop ollama"
echo ""
echo "📥 初始化模型（可选）："
echo "   ./scripts/init-ollama.sh" 