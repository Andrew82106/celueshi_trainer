#!/bin/bash
# 开始执行资源分包优化命令

# 备份assets目录
echo "正在备份资源文件..."
mkdir -p backup
tar -czf backup/assets_backup_$(date "+%Y%m%d%H%M%S").tar.gz assets

# 创建资源分包目录
echo "创建资源分包目录..."
mkdir -p packageZenAssets/assets/audio
mkdir -p packageTrainAssets/assets/vedio/number_voice
mkdir -p packageTrainAssets/assets/picture
mkdir -p packageRecordsAssets/assets/picture

# 移动音频文件到禅修资源分包
echo "移动木鱼、颂钵音频到禅修资源分包..."
mv assets/audio/songbo.wav packageZenAssets/assets/audio/ 2>/dev/null || echo "警告: assets/audio/songbo.wav 不存在"
mv assets/audio/muyu.wav packageZenAssets/assets/audio/ 2>/dev/null || echo "警告: assets/audio/muyu.wav 不存在"

# 移动训练相关音频到训练资源分包
echo "移动训练相关音频到训练资源分包..."
for audio in 0.wav 1.wav 2.wav 3.wav 4.wav 5.wav 6.wav 7.wav 8.wav 9.wav; do
  mv assets/vedio/number_voice/$audio packageTrainAssets/assets/vedio/number_voice/ 2>/dev/null || echo "警告: assets/vedio/number_voice/$audio 不存在"
done

# 移动训练相关图片到训练资源分包
echo "移动训练相关图片到训练资源分包..."
mv assets/picture/trainingBackground.jpeg packageTrainAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/trainingBackground.jpeg 不存在"
mv assets/picture/randombackground.png packageTrainAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/randombackground.png 不存在"

# 更新app.json，添加资源分包配置
echo "更新app.json，添加资源分包配置..."

# 创建资源分包入口文件
echo "创建资源分包入口文件..."
echo '// 禅修资源分包入口文件' > packageZenAssets/index.js
echo 'console.log("禅修资源分包加载成功");' >> packageZenAssets/index.js

echo '// 训练资源分包入口文件' > packageTrainAssets/index.js
echo 'console.log("训练资源分包加载成功");' >> packageTrainAssets/index.js

echo '// 记录资源分包入口文件' > packageRecordsAssets/index.js
echo 'console.log("记录资源分包加载成功");' >> packageRecordsAssets/index.js

# 更新引用路径
echo "更新资源引用路径..."

# 在禅修分包中更新木鱼、颂钵音频路径
find packageZen pages -type f -name "*.js" -o -name "*.wxml" -o -name "*.wxss" | xargs sed -i '' -E 's|/assets/audio/songbo.wav|/packageZenAssets/assets/audio/songbo.wav|g'
find packageZen pages -type f -name "*.js" -o -name "*.wxml" -o -name "*.wxss" | xargs sed -i '' -E 's|/assets/audio/muyu.wav|/packageZenAssets/assets/audio/muyu.wav|g'

# 在训练分包中更新音频和图片路径
find packageTrain -type f -name "*.js" -o -name "*.wxml" -o -name "*.wxss" | xargs sed -i '' -E 's|/assets/vedio/number_voice/([0-9]+.wav)|/packageTrainAssets/assets/vedio/number_voice/\1|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" -o -name "*.wxss" | xargs sed -i '' -E 's|/assets/picture/trainingBackground.jpeg|/packageTrainAssets/assets/picture/trainingBackground.jpeg|g'
find packageTrain -type f -name "*.js" -o -name "*.wxml" -o -name "*.wxss" | xargs sed -i '' -E 's|/assets/picture/randombackground.png|/packageTrainAssets/assets/picture/randombackground.png|g'

# 完成
echo "资源分包优化完成！"
echo "请在app.json中添加以下分包配置:"
echo '{
  "root": "packageZenAssets",
  "pages": [],
  "entry": "index.js"
},
{
  "root": "packageTrainAssets",
  "pages": [],
  "entry": "index.js"
},
{
  "root": "packageRecordsAssets",
  "pages": [],
  "entry": "index.js"
}'
echo "请在微信开发者工具中检查分包效果" 