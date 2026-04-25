# Floating Tools

悬浮工具箱 - 一组实用的 Tampermonkey/ScriptCat 用户脚本合集。

## 工具列表

| 工具 | 描述 |
|------|------|
| **NewsTool** | RSS/JSON 新闻抓取和日报生成 |
| **AiceTool** | AI 聊天导出工具（通义千问/夸克平台）|

## 架构说明

v0.2.0 版本已合并为单文件架构，所有功能集成在 `floating-tools.user.js` 中，通过浮动入口按钮统一控制。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [ScriptCat](https://github.com/scriptcat-org/scriptcat) 扩展
2. 复制 `floating-tools.user.js` 内容到扩展中创建新脚本
3. 刷新任意网页即可使用

## 使用方法

1. 点击右下角浮动按钮打开工具面板
2. 选择 **NewsTool** 或 **AiceTool**
3. 按提示操作：抓取新闻或导出 AI 聊天记录

### NewsTool 功能
- 内置 16 个默认新闻源
- 支持 RSS/JSON/网页 三种解析方式
- 自动生成 Markdown 日报
- 自定义下载文件夹

### AiceTool 功能
- 支持通义千问、夸克平台 Cookie 管理
- 多格式导出（Markdown/JSON/CSV）
- 定时自动导出

## 开发

脚本为原生 `.user.js` 格式，无需构建，可直接在扩展中编辑调试。

## 许可证

MIT
