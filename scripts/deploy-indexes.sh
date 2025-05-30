#!/bin/bash

# Firestore 索引部署脚本
echo "🚀 开始部署 Firestore 索引..."

# 检查是否安装了 Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI 未安装，请先安装："
    echo "npm install -g firebase-tools"
    exit 1
fi

# 检查是否已登录
if ! firebase projects:list &> /dev/null; then
    echo "❌ 请先登录 Firebase："
    echo "firebase login"
    exit 1
fi

# 部署索引
echo "📋 部署 Firestore 索引..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore 索引部署成功！"
    echo "📝 注意：索引构建可能需要几分钟时间"
    echo "🔗 你可以在 Firebase Console 中查看构建进度："
    echo "https://console.firebase.google.com/project/$(firebase use --current)/firestore/indexes"
else
    echo "❌ 索引部署失败，请检查配置"
    exit 1
fi 