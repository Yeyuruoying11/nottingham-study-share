#!/bin/bash

# Firebase Storage CORS 配置脚本
echo "🔧 配置 Firebase Storage CORS..."

# 检查是否安装了 gsutil
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil 未安装。请先安装 Google Cloud SDK:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 设置 CORS 配置
echo "📝 应用 CORS 配置到 Firebase Storage..."
gsutil cors set firebase-cors.json gs://guidin-db601.firebasestorage.app

echo "✅ CORS 配置完成！"
echo "🔍 验证配置:"
gsutil cors get gs://guidin-db601.firebasestorage.app 