# 拾光任务（plan-app）

本地部署、纯前端的个人任务规划与记录网页 —— **老黄历皮肤 + 泳道式横向时间线**。

正式版技术方案已确认（《设计方案》v1.0）：**Vue 3 + Vite + Pinia + vue-router(hash) + 原生 CSS tokens**。
本工程即《设计方案》§17 **阶段1（本地单机）** 的完整实现，覆盖 §14 **M2–M5** 全部内容，
功能与最终原型 `原型A-老黄历-泳道式/index.html` **1:1 对齐**。

---

## 快速开始

```bash
npm install        # 安装依赖（首次）
npm run start      # 一键启动 → http://localhost:5173（自动打开浏览器）
npm run dev        # 或直接启动 Vite 开发服务器
```

## 测试 / 构建

```bash
npm test           # Vitest：单元 + 组件测试（60 用例，含农历基准/泳道/迁移/表单/拖拽/弹幕）
npm run build      # 生产构建 → dist/index.html（单文件，可双击打开，也可静态服务托管）
npm run preview    # 本地预览构建产物
```

## 功能一览

- **日历**（月视图）：公历+农历+宜忌、优先级色任务标签（完成置灰划线）、翻月/回到今天、今日高亮；
  点击某天弹出**侧边栏**（勾选即变灰 / 编辑 / 删除 / 查看当天详情）。
- **当天页**：顶部实时时钟、日期栏（农历+干支+宜忌+今日进度、**最右添加按钮**）、任务列表、
  **全天区**（无时间任务始终可见）→ **泳道式时间线**（重叠上下分层、主体拖拽改时间/换行、
  右边缘把手调整时长、当前时间红线、打开自动滚动到当前时刻）、每日总结。
- **任务清单**：状态/类型筛选、紧急优先排序、展开详情（备注+完成记录）、新建/编辑/删除确认。
- **每日总结汇总**：按周分组，未写日期点击直达补写。
- **激励弹幕**：仅四时机（查看/完成/保存 + 欢迎），底部舞台不覆盖内容；顶栏「预览激励」可试播。
- **持久化**：localStorage；自动迁移原型 v2 数据；存储不可用降级内存（页面仍可用）。
- **数据备份（M5）**：顶栏「导出/导入」JSON，导出即完整备份，导入覆盖前二次确认。

## 数据与存储

| Key | 内容 |
| --- | --- |
| `planApp.tasks.v3` | 任务数组（模型含 `id(UUID)/version/createdAt/updatedAt` 演进字段） |
| `planApp.notes.v3` | 每日总结 `{ "2026-08-15": "文本" }` |
| `planApp.meta.v3` | 元信息（schemaVersion=3） |

- 启动时若发现原型数据 `planApp.tasks.v2`，自动执行**迁移链 v2→v3**：
  备份旧 key（`.bak`）、ID 转 UUID、补充 `version/updatedAt`、**不覆盖**已有 v3 数据。
- 存储适配层为**统一 Promise 契约**（`storage/adapter.js`），未来接入 `RemoteAdapter` 业务层零改动。

## 目录结构（要点）

```
plan-app/
├── scripts/            # start.mjs（一键启动）/ build.mjs（构建）
├── src/
│   ├── styles/         # tokens.css（老黄历设计变量）+ base.css（全站样式）
│   ├── storage/        # keys / adapter（Promise 契约 + 内存降级）/ migrations（v2→v3）
│   ├── stores/         # tasks / notes / ui（Pinia）
│   ├── utils/          # date / lunar（农历干支宜忌）/ priority / timeline（泳道算法）/ quotes
│   ├── composables/    # useDanmaku / useTimelineDrag / useTaskForm
│   ├── router/         # hash 路由（calendar / day/:date / tasks / notes）
│   └── components/     # layout / calendar / day / tasks / notes / common
└── tests/              # unit（单测）+ component（Vue Test Utils）
```

## 技术栈

Vue 3（Composition API）· Vite · Pinia · vue-router（hash）· 原生 CSS 变量 · Vitest + Vue Test Utils
