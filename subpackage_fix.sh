#!/bin/bash
# 修复分包问题

echo "备份重要文件..."
mkdir -p backup/pages
cp -r pages/muyu backup/pages/
cp -r pages/songbo backup/pages/
cp -r pages/meditation-writing backup/pages/

echo "检查缓存文件并删除..."
find . -name "*.!*" -delete

echo "重建木鱼页面文件夹结构..."
# 确保木鱼页面已正确复制到分包结构
mkdir -p packageZen/pages/muyu
cp -r pages/muyu/* packageZen/pages/muyu/ 2>/dev/null

echo "清理微信开发者工具缓存..."
rm -rf ./~*
rm -rf ./.miniPreviewLog*
rm -rf ./.DS_Store

echo "正在处理文件路径和引用..."
# 更新木鱼页面相关资源引用
find pages/muyu -type f -name "*.js" -o -name "*.wxml" -o -name "*.wxss" | xargs sed -i '' -E 's|/assets/audio/muyu.wav|/packageZenAssets/assets/audio/muyu.wav|g'

echo "修复完成！请重启微信开发者工具并清除缓存后再次上传。"
echo "在微信开发者工具中: 点击【工具】->【清除缓存】->【清除全部缓存】，然后重启工具。" 