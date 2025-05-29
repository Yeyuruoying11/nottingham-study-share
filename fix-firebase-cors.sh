#!/bin/bash

echo "🔧 正在应用 Firebase Storage CORS 配置..."
echo ""
echo "请确保你已经安装了 Google Cloud SDK (gsutil)"
echo ""

# 检查 gsutil 是否安装
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil 未安装。请先安装 Google Cloud SDK："
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 应用 CORS 配置
echo "📤 正在上传 CORS 配置到 Firebase Storage..."
gsutil cors set firebase-cors.json gs://guidin-db601.firebasestorage.app

if [ $? -eq 0 ]; then
    echo "✅ CORS 配置已成功应用！"
    echo ""
    echo "📋 当前 CORS 配置："
    gsutil cors get gs://guidin-db601.firebasestorage.app
else
    echo "❌ CORS 配置应用失败。请检查："
    echo "   1. 你是否已经登录到正确的 Google Cloud 账号"
    echo "   2. 你是否有权限访问这个 Storage bucket"
    echo ""
    echo "运行以下命令登录："
    echo "   gcloud auth login"
fi 