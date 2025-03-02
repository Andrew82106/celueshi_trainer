# 山门知行训练应用

## 项目概述

山门知行是一款专注于认知能力和语言能力训练的微信小程序，旨在帮助用户通过系统性训练提升注意力、记忆力、语言表达和思维逻辑等多方面能力。应用提供多种科学训练方案，记录训练历史，追踪能力提升过程。

## 主要功能模块

### 中英互翻训练
- **双向翻译模式**：支持英译中和中译英两种训练方向
- **智能评测**：接入GLM大模型API，提供专业翻译评分和改进建议
- **详细分析**：对每个翻译片段给予0-10分的精确评分，并提供具体改进建议
- **历史记录**：保存训练结果，方便复习和对比进步

### 舒尔特表训练
- **可调整难度**：支持3×3至10×10的表格尺寸
- **实时反馈**：训练过程中显示用时和错误数
- **完整记录**：记录每次训练的表格大小、完成时间和错误次数
- **专注力培养**：经典的注意力分配和视觉扫描能力训练工具

### 圆点闪视训练
- **自定义参数**：可设置圆点数量范围(2-20)和闪现时间(毫秒级精确控制)
- **随机生成**：每次训练随机生成不同数量和位置的圆点
- **快速感知训练**：锻炼视觉快速捕捉和数量感知能力
- **训练记录**：保存每次训练的参数设置和正确率

### 正听反说训练
- **听觉记忆训练**：系统播放随机数字音频，用户需逆序输入
- **可调节难度**：支持5-20位数字长度
- **音频播放**：清晰的数字音频提示，无需依赖视觉
- **即时反馈**：训练完成后立即给出正确答案和评估
- **成绩记录**：保存每次训练的数字长度和正确情况

## 技术架构

### 前端技术
- **框架**：微信小程序原生开发框架
- **UI组件**：自定义导航栏、进度条、卡片视图等组件
- **交互设计**：流畅的动画过渡和反馈机制
- **适配性**：适配不同尺寸的移动设备

### 后端接口
- **智能评测**：接入智谱GLM-4大模型API进行翻译质量评估
- **数据处理**：JSON格式数据交互，支持复杂评测结果解析

### 存储机制
- **本地存储**：利用微信小程序的本地存储功能存储用户训练记录
- **数据分类**：按训练类型分别存储（translateRecords、schulteRecords等）
- **用户绑定**：训练记录与微信用户身份绑定，确保数据安全

### 用户体验优化
- **一致性设计**：统一的色彩系统和交互模式
- **渐进式引导**：由简到难的训练流程设计
- **成就激励**：通过历史记录和进步统计激励持续训练
- **即时反馈**：训练过程中的实时反馈和结果展示

## 项目特色

1. **科学性**：基于认知科学设计的训练方法，有效提升专注力和记忆力
2. **全面性**：涵盖视觉、听觉、语言等多维度能力训练
3. **个性化**：可根据个人能力调整训练难度和参数
4. **数据驱动**：详细的训练记录帮助用户了解自己的能力提升轨迹
5. **无障碍使用**：简洁直观的界面设计，适合各年龄段用户

## 开发环境

- 微信开发者工具 v3.7.8及以上
- 小程序基础库 v3.7.8及以上
- Node.js环境（用于开发和调试）

## 项目结构

```
/pages
  /index                 # 首页
  /main                  # 登录页
  /profile               # 个人中心
  /schulte-table         # 舒尔特表训练
  /schulte-records       # 舒尔特表记录
  /dot-training          # 圆点闪视训练
  /dot-records           # 圆点闪视记录
  /audio-training        # 正听反说训练
  /audio-records         # 正听反说记录
  /translate-training    # 翻译训练主页
  /translate-drill       # 翻译训练过程
  /translate-review      # 翻译评测
  /translate-records     # 翻译训练记录
```

## 使用说明

1. 首次使用需进行微信登录授权
2. 在首页选择需要训练的能力模块
3. 设置训练参数（如难度等级）
4. 完成训练后查看结果评分和建议
5. 在个人中心查看历史训练记录和成绩统计

## 未来计划

- 增加更多训练模块（如工作记忆训练、逻辑推理训练等）
- 添加社交功能，支持好友间的训练比拼
- **开发数据分析功能，提供更详细的能力评估报告**
- 优化UI/UX设计，提升用户体验

---

© 2023 山门知行 - 专注于认知能力训练的微信小程序
