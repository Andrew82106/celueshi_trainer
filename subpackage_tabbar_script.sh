#!/bin/bash
# 处理tabBar图标分包

# 创建分包目录
echo "创建tabBar图标目录..."
mkdir -p packageZenAssets/assets/picture

# 复制tabBar图标到Zen资源分包
echo "复制tabBar图标到Zen资源分包..."
cp -r assets/picture/muyu.png packageZenAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/muyu.png 不存在"
cp -r assets/picture/muyuClick.png packageZenAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/muyuClick.png 不存在"
cp -r assets/picture/songbo.png packageZenAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/songbo.png 不存在"
cp -r assets/picture/songboClick.png packageZenAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/songboClick.png 不存在"
cp -r assets/picture/writingButton.png packageZenAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/writingButton.png 不存在"
cp -r assets/picture/personalInfo.png packageZenAssets/assets/picture/ 2>/dev/null || echo "警告: assets/picture/personalInfo.png 不存在"

# 更新app.json中tabBar图标路径
echo "更新app.json中tabBar图标路径..."

# 完成
echo "tabBar图标分包处理完成！"
echo "请手动修改app.json中的tabBar图标路径为:"
echo '"iconPath": "packageZenAssets/assets/picture/muyu.png"'
echo '"selectedIconPath": "packageZenAssets/assets/picture/muyu.png"'
echo '"iconPath": "packageZenAssets/assets/picture/songbo.png"'
echo '"selectedIconPath": "packageZenAssets/assets/picture/songbo.png"'
echo '"iconPath": "packageZenAssets/assets/picture/writingButton.png"'
echo '"selectedIconPath": "packageZenAssets/assets/picture/writingButton.png"'
echo '"iconPath": "packageZenAssets/assets/picture/personalInfo.png"'
echo '"selectedIconPath": "packageZenAssets/assets/picture/personalInfo.png"' 