#!/bin/bash
# 开始执行分包处理命令

# 备份整个项目
echo "正在备份项目..."
mkdir -p backup
tar -czf backup/project_backup_$(date "+%Y%m%d%H%M%S").tar.gz pages app.json

# 训练分包页面复制
echo "正在处理训练分包..."
for page in dot-training audio-training schulte-table translate-training translate-drill translate-review; do
  mkdir -p packageTrain/pages/$page
  cp -r pages/$page/* packageTrain/pages/$page/ 2>/dev/null || echo "警告: pages/$page 不存在或为空"
done

# 管理员页面处理
mkdir -p packageTrain/pages/admin
cp -r pages/admin/* packageTrain/pages/admin/ 2>/dev/null || echo "警告: pages/admin 不存在或为空"

# 记录分包页面复制
echo "正在处理记录分包..."
for page in schulte-records dot-records audio-records translate-records translate-train-records; do
  mkdir -p packageRecords/pages/$page
  cp -r pages/$page/* packageRecords/pages/$page/ 2>/dev/null || echo "警告: pages/$page 不存在或为空"
done

# 禅修分包页面复制
echo "正在处理禅修分包..."
mkdir -p packageZen/pages/meditation-writing/edit
mkdir -p packageZen/pages/meditation-writing/records
mkdir -p packageZen/pages/meditation-writing/community
cp -r pages/meditation-writing/edit/* packageZen/pages/meditation-writing/edit/ 2>/dev/null || echo "警告: pages/meditation-writing/edit 不存在或为空"
cp -r pages/meditation-writing/records/* packageZen/pages/meditation-writing/records/ 2>/dev/null || echo "警告: pages/meditation-writing/records 不存在或为空"
cp -r pages/meditation-writing/community/* packageZen/pages/meditation-writing/community/ 2>/dev/null || echo "警告: pages/meditation-writing/community 不存在或为空"

# 更新页面跳转路径
echo "正在更新页面跳转路径..."

# 训练分包页面路径更新
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/dot-training/|/packageTrain/pages/dot-training/|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/audio-training/|/packageTrain/pages/audio-training/|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/schulte-table/|/packageTrain/pages/schulte-table/|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-training/|/packageTrain/pages/translate-training/|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-drill/|/packageTrain/pages/translate-drill/|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-review/|/packageTrain/pages/translate-review/|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/admin/|/packageTrain/pages/admin/|g'

# 记录分包页面路径更新
find packageTrain packageRecords -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/schulte-records/|/packageRecords/pages/schulte-records/|g'
find packageTrain packageRecords -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/dot-records/|/packageRecords/pages/dot-records/|g'
find packageTrain packageRecords -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/audio-records/|/packageRecords/pages/audio-records/|g'
find packageTrain packageRecords -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-records/|/packageRecords/pages/translate-records/|g'
find packageTrain packageRecords -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-train-records/|/packageRecords/pages/translate-train-records/|g'

# 禅修分包页面路径更新
find packageZen -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/meditation-writing/edit/|/packageZen/pages/meditation-writing/edit/|g'
find packageZen -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/meditation-writing/records/|/packageZen/pages/meditation-writing/records/|g'
find packageZen -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/meditation-writing/community/|/packageZen/pages/meditation-writing/community/|g'

# 更新主包中对分包页面的引用
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/dot-training/|/packageTrain/pages/dot-training/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/audio-training/|/packageTrain/pages/audio-training/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/schulte-table/|/packageTrain/pages/schulte-table/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-training/|/packageTrain/pages/translate-training/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-drill/|/packageTrain/pages/translate-drill/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-review/|/packageTrain/pages/translate-review/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/admin/|/packageTrain/pages/admin/|g'

find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/schulte-records/|/packageRecords/pages/schulte-records/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/dot-records/|/packageRecords/pages/dot-records/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/audio-records/|/packageRecords/pages/audio-records/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-records/|/packageRecords/pages/translate-records/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/translate-train-records/|/packageRecords/pages/translate-train-records/|g'

find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/meditation-writing/edit/|/packageZen/pages/meditation-writing/edit/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/meditation-writing/records/|/packageZen/pages/meditation-writing/records/|g'
find pages -type f -name "*.js" -o -name "*.wxml" | xargs sed -i '' -E 's|/pages/meditation-writing/community/|/packageZen/pages/meditation-writing/community/|g'

# 确保组件和工具引用路径正确
echo "检查组件引用路径..."

# 完成
echo "分包处理完成！"
echo "请在微信开发者工具中检查分包效果"
echo "备注：可能需要手动修复一些特殊路径引用，请在测试中发现并修复"
