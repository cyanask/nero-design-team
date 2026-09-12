# NERO Design Team 3.0

<img src="docs/assets/ndt-hero.svg?v=system-only" width="100%" alt="NDT 3.0：设计资产管理系统与 Skill">

[English](README.md) · 简体中文 · Apache License 2.0

NERO Design Team（NDT）是面向 Coding Agent 的设计资产管理系统及配套 Skill，提供分类、检索、复用、风格版本管理、任务路由和设计验收机制。

**本仓库只开源系统和 Skill，不开源 NERO 的资产库、案例库或风格库内容。三个库默认为空，由使用者在本地建立。**

## 三个库，一个系统

| 库 | 管理对象 | 开源状态 |
|---|---|---|
| 资产库 | 可复用资源、元数据、来源和使用边界 | 空库，保留分类和管理机制 |
| 案例库 | 完整作品、设计决策与验收记录 | 空库，保留索引和管理机制 |
| 风格库 | 风格定义、适用条件及版本记录 | 空库，保留索引和管理机制 |

配方是组织复用的辅助机制，不是第四个库。系统不附带 NERO 的个人风格、设计作品、案例快照或资源预览。

## 开源内容

- Skill：理解任务、选择工作路径、调用工具和组织视觉验收。
- 管理工具：资产分类与检索、案例索引、风格版本及引用边界。
- 前端代码：本地只读浏览器，展示接入的目录和来源状态。
- 运行与检查工具：MCP、生成器、确定性图形工具、QA 和发布检查。
- 开发支撑：数据结构、默认界面样式、最小代码模板和合成测试数据。这些用于运行和验证系统，不是 NERO 的三个资料库。

当前公开前端不包含编辑、上传或删除库内容的管理界面。软件和网页设计仅支持桌面端；公众号图片和竖版视频属于媒体输出。

## 快速开始

```bash
git clone https://github.com/cyanask/nero-design-team.git
cd nero-design-team
node install.mjs
node doctor.mjs
```

安装器将 Skill 安装到 Codex 的 Skill 目录。按需采用 [AGENTS.template.md](AGENTS.template.md) 中的路由说明，然后向 Agent 提出设计任务。空库状态下不会假称已找到或采用你的资源。

启动只读前端：

```bash
cd frontend
npm ci
npm run snapshot:sync -- --ndt-home ..
npm run dev
```

`npm run demo` 提供独立的合成测试示例，不包含 NERO 的库内容。详见 [前端说明](frontend/README.md)。

## 文档

[开源边界](docs/oss-boundary.md) · [本地私有资料](docs/private-overlay.md) · [Registry 与风格管理](registry/README.md) · [Skill](skills/nero-design-team/SKILL.md) · [MCP](mcp-lite/README.md) · [参与贡献](CONTRIBUTING.md)

运行 `npm run release:check` 检查发行文件、许可和空库边界；运行 `node doctor.mjs` 检查工具合同。

## 版本与许可

3.0 系列当前开源系统与 Skill，不再以资源数量宣传。历史提交和旧标签可能仍包含旧发行内容；当前空库不代表历史已清除。

代码采用 [Apache License 2.0](LICENSE)。许可证的“2.0”与产品版本无关，用户自己的库内容不会因此自动获得开源授权。详见 [许可说明](docs/LICENSE-NOTES.md)。
