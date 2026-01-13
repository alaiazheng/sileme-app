#!/bin/bash

echo "🚀 启动死了么后端服务..."

# 检查Node.js版本
echo "📋 检查环境..."
node --version
npm --version

# 创建必要的目录
echo "📁 创建目录..."
mkdir -p logs uploads

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动MongoDB（如果使用Docker）
echo "🗄️ 启动MongoDB..."
if ! docker ps | grep -q mongodb; then
    docker run -d --name mongodb -p 27017:27017 mongo:7.0 || echo "MongoDB可能已在运行或需要手动启动"
fi

# 等待MongoDB启动
echo "⏳ 等待数据库连接..."
sleep 3

# 启动开发服务器
echo "🎯 启动API服务器..."
npm run dev