#!/bin/bash

echo "🤖 初始化 Ollama 服务..."

# 等待ollama服务启动
echo "⏳ 等待 Ollama 服务启动..."
until curl -f http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "等待 Ollama 服务..."
    sleep 5
done

echo "✅ Ollama 服务已启动"

echo "🔗 API 地址: http://localhost:11434"
echo "📚 文档: https://ollama.ai/library" 