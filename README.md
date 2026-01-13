# 死了么 - 网页版

一个简约的生活状态提醒应用，灵感来源于同名移动应用。

## 功能特点

- 🎯 **一键打卡** - 简单快捷的生活状态确认
- 🔔 **紧急通知** - 重要消息及时推送提醒  
- 🛡️ **隐私保护** - 数据完全本地存储，保护隐私安全
- 📱 **响应式设计** - 完美适配手机、平板和桌面设备
- 💾 **离线支持** - PWA技术，支持离线使用
- 🎨 **简约美观** - 清新的绿色主题，符合现代设计理念

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **图标库**: Lucide React
- **路由**: React Router
- **日期处理**: date-fns
- **PWA**: Service Worker + Web App Manifest

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发模式

\`\`\`bash
npm run dev
\`\`\`

应用将在 http://localhost:3000 启动

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 预览生产版本

\`\`\`bash
npm run preview
\`\`\`

## 项目结构

\`\`\`
src/
├── components/          # 通用组件
│   ├── Header.jsx      # 页面头部
│   ├── Navigation.jsx  # 底部导航
│   ├── Layout.jsx      # 布局组件
│   └── LoadingSpinner.jsx
├── pages/              # 页面组件
│   ├── Home.jsx        # 首页
│   ├── CheckIn.jsx     # 打卡页面
│   ├── Notifications.jsx # 通知页面
│   ├── Privacy.jsx     # 隐私页面
│   └── Settings.jsx    # 设置页面
├── context/            # 状态管理
│   └── AppContext.jsx  # 应用状态
├── hooks/              # 自定义Hook
│   ├── useLocalStorage.js
│   └── useNotification.js
├── utils/              # 工具函数
│   └── dateUtils.js
├── App.jsx             # 根组件
├── main.jsx           # 入口文件
└── index.css          # 全局样式
\`\`\`

## 核心功能

### 打卡系统
- 每日一次打卡记录
- 心情状态选择
- 备注信息添加
- 连续打卡统计

### 通知系统
- 多种通知类型（普通、重要、紧急、成功）
- 已读/未读状态管理
- 自定义通知创建

### 数据管理
- 本地存储（LocalStorage）
- 数据导出/导入
- 一键清除数据
- 隐私保护

### 响应式设计
- 移动端优先设计
- 适配不同屏幕尺寸
- 触摸友好的交互
- PWA支持

## 浏览器支持

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- 移动端浏览器

## 隐私说明

- 所有数据仅存储在用户设备本地
- 不收集、不上传任何个人信息
- 支持数据导出和完全删除
- 完全离线运行，无需网络权限

## 开发说明

### 自定义主题

修改 \`tailwind.config.js\` 中的颜色配置：

\`\`\`javascript
theme: {
  extend: {
    colors: {
      brand: {
        green: '#00D084',
        'green-light': '#4AE6A8',
        'green-dark': '#00B56F',
      }
    }
  }
}
\`\`\`

### 添加新页面

1. 在 \`src/pages/\` 创建新组件
2. 在 \`src/App.jsx\` 添加路由
3. 在 \`src/components/Navigation.jsx\` 添加导航项

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！