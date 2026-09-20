# 部署到 zhidaoflow.cn `/loop-kanban/`

静态导出，数据只存在浏览器 `localStorage`，**不需要** Node / API。不要动现有 `/app` SaaS。

目标 URL：https://zhidaoflow.cn/loop-kanban/  
服务器目录：`/www/wwwroot/zhidaoflow.cn/loop-kanban/`

## 1. 构建

在仓库根目录（或 `apps/risk-kanban`）：

```bash
npm run build:zhidao
```

等价于 `STATIC_EXPORT=1 BASE_PATH=/loop-kanban` 的 `output: 'export'`。产物在：

`apps/risk-kanban/out/`

应能看到 `index.html`、`seats/index.html`、`gates/index.html`、`sop/index.html`、`risk/index.html`、`_next/`。

本地默认不要设 `BASE_PATH`：

```bash
npm run dev          # http://localhost:3000
npm run build        # Node 模式，无子路径
```

本机模拟子路径：

```bash
BASE_PATH=/loop-kanban npm run dev
# 打开 http://localhost:3000/loop-kanban
```

## 2. 上传（不要套一层目录）

把 **`out/` 里的内容** 拷到站点目录，不要把 `out` 文件夹本身再嵌一层：

```bash
# 示例：在能 ssh 的机器上
rsync -av --delete apps/risk-kanban/out/ user@host:/www/wwwroot/zhidaoflow.cn/loop-kanban/
```

或 Windows / 宝塔：上传 `out/` 内文件到 `/www/wwwroot/zhidaoflow.cn/loop-kanban/`。

完成后目录应类似：

```
/www/wwwroot/zhidaoflow.cn/loop-kanban/index.html
/www/wwwroot/zhidaoflow.cn/loop-kanban/_next/...
/www/wwwroot/zhidaoflow.cn/loop-kanban/seats/index.html
/www/wwwroot/zhidaoflow.cn/loop-kanban/risk/index.html
```

不要覆盖 `/www/wwwroot/zhidaoflow.cn/app/`。

## 3. Nginx

若站点根已经是 `/www/wwwroot/zhidaoflow.cn`，静态文件会自然落到 `/loop-kanban/`。

若根站点有 SPA `try_files … /index.html` 会吞掉子路径，在 **SPA fallback 之前** 加：

```nginx
location ^~ /loop-kanban/ {
    alias /www/wwwroot/zhidaoflow.cn/loop-kanban/;
    index index.html;
}
```

改完 `nginx -t && nginx -s reload`。

## 4. 验收

打开 https://zhidaoflow.cn/loop-kanban/ ：

- 四列灯性看板，资源 URL 带 `/loop-kanban/_next/`
- `/loop-kanban/seats/`、`/loop-kanban/gates/`、`/loop-kanban/sop/`
- 点卡片进 `/loop-kanban/risk/?id=D-01`（新建事件刷新后仍在，因数据在本机）

## 5. 数据

看板完全客户端持久化（`localStorage` 键 `loop-park-risk-kanban-v3`）。静态托管下没有 `/api/risks`。Node 模式下 API 仍可选同步。

## 6. 可选：Node 反代（一般不用）

```bash
BASE_PATH=/loop-kanban npm run build
PORT=3001 npm start
```

再把 `/loop-kanban` 反代到 `127.0.0.1:3001`。静态方案更简单，与 `/app` 隔离。
