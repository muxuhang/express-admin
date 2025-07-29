#!/bin/bash

echo "🚀 启动生产环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 停止现有容器（不删除）
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml stop

# 构建并启动生产环境
echo "🔨 构建并启动生产环境..."
docker-compose -f docker-compose.prod.yml up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "📊 服务状态："
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ 生产环境启动完成！"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost"
echo "   后端API: http://localhost/api"
echo "   MongoDB管理: http://localhost:8081"
echo ""
echo "📝 查看日志："
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 停止服务："
echo "   docker-compose -f docker-compose.prod.yml down" 