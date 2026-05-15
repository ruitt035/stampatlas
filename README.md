# 去盖章！GO GO GO

> 旅游盖章收集APP - 宝可梦像素风格

## 🎮 功能特点

- 🗺️ 百度地图集成，支持搜索定位
- 📍 点击地图添加印章标记（宝可梦红白球风格）
- 📝 编辑文字记录，支持多行文本
- 📷 上传盖章图片，支持预览
- 📋 记录列表，支持时间排序和分类
- 🎉 收集新章动画庆祝
- 📤 生成分享图片

## 🚀 部署指南

### 方法一：Vercel（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录（会打开浏览器授权）
vercel login

# 进入项目目录
cd "C:\Users\tt\Desktop\coding"

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

部署后获得永久 HTTPS 链接，如：`https://qugaizhang.vercel.app`

### 方法二：GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. 选择 `main` 分支，`/` 目录
4. 点击 Save，等待部署完成

### 方法三：静态服务器

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node
npx serve .

# 使用 PHP
php -S localhost:8000
```

## 📁 项目结构

```
.
├── index.html          # 主页面
├── styles.css          # 样式文件
├── vercel.json         # Vercel 配置
├── src/
│   ├── app.js          # 应用入口
│   ├── mapView.js      # 地图视图
│   ├── settingsView.js # 设置视图
│   ├── db.js           # 数据库操作
│   ├── utils.js        # 工具函数
│   ├── icons.js        # 图标定义
│   └── locations.js    # 地区数据
└── .trae/              # 项目文档（可选）
```

## 🔧 配置说明

### 百度地图 API

已内置 AK 密钥，无需额外配置：
- AK: `CWBcvwmwSnVzjr0tPQzg0hqJe9MyJ1ZX`

### 数据存储

- 使用 IndexedDB 本地存储
- 所有数据保存在用户浏览器中
- 无需后端服务器

## 🌐 访问链接

部署后访问：
- Vercel: `https://<project-name>.vercel.app`
- GitHub Pages: `https://<username>.github.io/<repo-name>`

## 📱 GoNative 打包

将部署后的 URL 输入 GoNative.io 即可打包成安卓 APP。

## 📄 许可证

MIT License
