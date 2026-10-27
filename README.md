# Wang Tairan · 学生活动作品集

网站界面、示例内容、日期、错误提示和后台字段现已统一为英文。已有后台可运行 `npm run cms:english`，同步英文标签和初始文案；脚本仅翻译匹配的原始默认内容，不覆盖后来编辑的内容。

Nuxt / Vue 3 / TypeScript / Tailwind 展示站，Directus 内容后台，PostgreSQL 数据库。首页、五个栏目列表、图文详情均支持 PC 与手机。未配置 CMS 时正常模式会明确报错；示例内容只在显式 demo 模式展示。

## 本地预览

需要 Node.js **22.22.3 或更高受 Nuxt 支持的 LTS 版本**。

```bash
npm ci
npm run dev:demo
```

访问终端输出的本地地址（默认 http://localhost:3000）。演示模式包含 7 篇明确标注的示例活动和本地场景图片。示例不代表学生的真实经历，也不会被初始化脚本写入正式后台。

本次工作区已安装依赖，Windows 可直接使用隔离的新版 Node，避免系统旧 Node 20 的兼容问题：

```powershell
.\.tools\node.exe scripts/demo.mjs dev
```

普通开发连接真实后台：

```bash
cp .env.example .env
# 修改 .env 中三个密码/密钥占位值
docker compose up -d database directus
# 等待 http://localhost:8055/server/health 返回 ok
npm run cms:setup
npm run dev
```

后台地址 http://localhost:8055，账号与密码为 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD`。所有密码仅留在本地环境变量，不能提交 `.env`。

如本机没有 Docker，可安装隔离的本地验证后台（SQLite，仅用于开发，生产仍用 PostgreSQL）：

```bash
npm install --prefix .tools/cms directus@11.17.4 sqlite3@5.1.7
node scripts/local-cms.mjs
# 新终端：
npm run cms:setup
npm run dev
```

`local-cms.mjs` 仅在 `.env` 不存在时生成随机开发密码；已有配置不会被覆盖。开发数据放在被 Git 忽略的 `.tools/cms`。Windows 若系统 Node 过旧，可使用本次下载的 `.tools/node.exe`，或自行升级系统 Node。

## 内容维护

1. 在「个人资料」填写简介、学校、兴趣和首页照片。公开邮箱可以留空。
2. 五个栏目已初始化：Volunteering、Summer School、Academics、Publications、Hobbies。可编辑栏目标题、介绍和顺序。
3. 在「活动记录」新建草稿，填写标题、固定链接、分类、日期、摘要、角色、地点及封面。
4. 「图文正文」支持标题、段落、引用、列表、表格及图片。相册与附件在「相册与附件」中管理，支持图注、用途和拖动排序。
5. 在文件库的文件详情中，明确开启「允许公开」。新上传文件默认私有；正文图片同样必须开启该开关。正文仅展示经过本站媒体端点的图片，不嵌入外部跟踪图片或任意 HTML。
6. 活动改为「已发布」后，刷新前台即可看到。开启「首页精选」后可显示在首页，最多三篇，按后台顺序排列。
7. 归档或改回草稿会从公开列表及详情撤下。已经明确公开的文件独立管理，若也需撤回，请关闭文件的「允许公开」。

初始化脚本可重复运行，只补充缺失模型、关系和默认分类，不覆盖已有活动与个人资料。公开策略仅授权读取已发布活动、受关联活动发布状态约束的媒体记录，以及主动公开的文件；不会给访客任何写权限。重复公开策略可能叠加放宽访问，初始化发现时会明确中止。

后台固定使用 Directus 11.17.4。Directus 12 的授权机制会限制自定义权限，不能直接升级到 12 或使用 `latest` 镜像；升级前需要核实授权和重新执行权限验收。

## 数据与接口

| 集合 | 内容 |
| --- | --- |
| `profile` | 单例个人资料 |
| `categories` | 五个活动栏目 |
| `activities` | 状态、标题、slug、日期、摘要、角色、地点、封面、正文、成果、反思、精选及顺序 |
| `activity_media` | 活动关联、文件、相册/附件类型、说明及顺序 |
| `directus_files.is_public` | 显式控制文件是否公开，默认 false |

- `GET /api/portfolio`：个人资料、分类和已发布活动摘要。
- `GET /api/activities/:slug`：一篇已发布活动，未知/未发布返回 404。
- `GET /api/media/:uuid`：受 CMS 公开文件权限约束的同源文件服务；图片支持 `width=480/800/1200/1600`。
- CMS 不可用返回 503。公开站没有管理员令牌，所有请求都经过 Directus 公开权限。
- SSR 查询和文件默认不缓存，以确保撤回立即对新请求生效。上传文件上限在生产配置为 20 MB。

## 验证

```bash
npm test
npm run typecheck
npm run build
npm run cms:verify
```

`cms:verify` 会在指定 CMS 创建临时草稿与文件，实际测试发布、归档、匿名读写权限、私有附件和公开文件撤回，最后删除自己创建的数据。请在独立开发/验收环境运行。

人工验收：PC（1440px）、手机（390px）的首页、五个栏目、详情；活动排序、菜单、复制链接、空栏目、错误链接；后台图文图片上传及附件下载。`test-results/` 保存本地验证截图，不提交仓库。

实际验收结果与未验证的生产环境事项见 [VALIDATION.md](VALIDATION.md)。可选浏览器验证脚本使用 Windows 本地 Chrome：先运行 `npm install --prefix .tools/browser playwright@1.64.1`，启动演示服务后运行 `node scripts/browser-check.mjs`；后台和连接真实 CMS 的前台（3001 端口）启动后运行 `node scripts/live-check.mjs`。

## 生产部署

1. 使用国内 Linux 服务器，安装 Docker Compose，配置域名及可用 HTTPS 证书。
2. 复制 `.env.example` 为 `.env`，设置随机密码、密钥，以及 `NUXT_PUBLIC_SITE_URL=https://你的展示域名`、`NUXT_PUBLIC_CMS_URL=https://你的后台域名`。
3. 修改 `deploy/nginx.conf` 中的两个 `example.com` 域名。将覆盖两个域名的证书放入 `deploy/certs/fullchain.pem` 和 `deploy/certs/privkey.pem`。续期后重新加载 Nginx。
4. 运行 `docker compose up -d --build database directus web`，待后台就绪后在服务器执行 `npm ci && npm run cms:setup`，再运行 `docker compose --profile production up -d proxy`。
5. 完善真实资料，发布实际内容，执行 `npm run cms:verify`（首次上线前），检查 HTTPS、图片及详情链接。

只有 Nginx 的 80/443 端口对公网开放。Node 与 Directus 端口绑定服务器回环地址，数据库没有公开端口。PostgreSQL 与上传文件使用命名卷；**不要执行 `docker compose down -v`，它会删除数据**。应用不依赖海外字体或远程图片服务。

不使用 Sites 托管：本项目按确认的国内 Linux + PostgreSQL 架构交付，需实际服务器、域名及证书才能上线。

### 备份与恢复

在服务器安装并配置 `rclone`，目标必须是服务器之外的对象存储/备份主机。设置仅服务器可读的 `deploy/backup.env`：

```bash
export BACKUP_REMOTE='your-remote:portfolio-backups'
```

每天定时备份（下面服务器时区应设为 Asia/Shanghai）：

```cron
0 3 * * * cd /srv/portfolio && . deploy/backup.env && bash deploy/backup.sh >> /var/log/portfolio-backup.log 2>&1
```

脚本保存 PostgreSQL 自定义格式快照及上传文件归档，并上传到远端；任何步骤失败都会退出非零。为远端配置保留策略/容量告警。数据库快照与文件归档之间应避免删除文件，建议在低频维护时间运行。

恢复先将相同时间戳的 `.dump` 与 `.uploads.tar.gz` 从远端下载到 `deploy/backups/`，备份当前环境后执行：

```bash
CONFIRM_RESTORE=replace-current-database bash deploy/restore.sh 20261026T030000Z
```

恢复会暂停前台和后台并替换数据库内容，随后恢复文件及服务。失败时保持前后台停止以避免继续写入。每次首次部署或升级后，在测试环境演练恢复，再检查个人资料、活动、原图和附件。

## 示例照片来源

`public/images` 中图片下载自 Unsplash，仅作为场景示意，不是该学生的活动照片。下载来源和 ID 固定在 `scripts/download-demo-images.mjs`，页面演示提示明确区分示例。正式内容应通过后台上传本人授权使用的照片。

首页参考图的姓名和结构保留；学校/兴趣仅用于演示个人介绍。正式后台不会自动导入活动、虚构成绩或量化成果。
