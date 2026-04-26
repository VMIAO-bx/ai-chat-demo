# 🤖 AI 智能助手

> 一个基于 DeepSeek API 的智能对话助手，支持流式输出、多轮记忆、角色切换，可安装至手机桌面。

**在线体验**：[点击试用](https://ai-chat-demo-production.up.railway.app)  
**GitHub 仓库**：[项目地址](https://github.com/VMIAO-bx/ai-chat-demo)

---

## 📸 效果截图

（稍后贴两张截图：PC端聊天界面 + 手机桌面图标）

---

## ✨ 核心功能

- 💬 **流式对话**：类 ChatGPT 打字机效果，实时逐字输出
- 🧠 **多轮记忆**：记住上下文，支持连续对话
- 🎭 **角色切换**：通用助手 / 翻译助手 / 代码助手 / 情感树洞
- 📱 **PWA 支持**：可安装至手机桌面，离线可用
- 🚀 **全栈部署**：前端 + 后端统一托管于 Railway

---

## 🛠️ 技术栈

| 层级     | 技术                                  |
| -------- | ------------------------------------- |
| 前端     | 原生 HTML5 / CSS3 / JavaScript (ES6+) |
| 后端     | Node.js / Express                     |
| AI 接口  | DeepSeek API                          |
| 部署     | Railway (全栈)                        |
| 版本控制 | Git / GitHub                          |
| 其他     | PWA (Service Worker + Manifest)       |

---

## 🏗️ 项目结构

ai-chat-demo/
├── public/
│ ├── index.html # 主页面
│ ├── manifest.json # PWA 配置
│ ├── sw.js # Service Worker
│ └── icon.svg # 手机/PC 图标
├── server.js # 后端服务
├── package.json # 依赖配置
└── README.md # 项目文档

---

## 🚀 本地运行

1. **克隆项目**
```bash
git clone https://github.com/VMIAO-bx/ai-chat-demo.git
cd ai-chat-demo
```

## 📦 部署

项目使用 Railway 全栈部署：

1. 代码推送到 GitHub

2. Railway 自动拉取并构建

3. 在 Railway 后台配置环境变量 `DEEPSEEK_API_KEY`

4. 自动生成公网地址  

   

## 🙋 常见问题

**Q: AI 为什么回答得慢？**
A: 免费部署的 Railway 实例会有冷启动，首次访问需要 3-5 秒唤醒。

**Q: 手机上怎么安装？**
A: 用 Safari（iOS）或 Chrome（安卓）打开网站 → 分享菜单 → 添加到主屏幕。

**Q: 流式输出怎么实现的？**
A: 后端使用 SSE 分块传输，前端用 `fetch` + `ReadableStream` 逐步渲染。

## 📝 TODO（后续优化）

- 支持 Markdown 渲染（粗体、斜体）
- 添加对话历史本地存储
- 支持语音输入
- 夜间模式

## 📄 许可证

MIT License

## 🙏 致谢

- [DeepSeek](https://deepseek.com/) 提供大模型 API
- [Railway](https://railway.com/) 提供免费部署服务