# 启程下载站

多应用、多渠道的 APK 发包下载站。前台面向移动端，后台供管理员上传最新安装包。

## 功能

- 前台：选择应用 → 选择渠道 → 下载 Android；iOS 入口预留
- 后台：账号密码登录，管理应用/渠道，上传并覆盖最新 APK
- 数据：SQLite + 本地目录存包（Docker Volume）
- 部署：Docker Compose，适配腾讯云

## 本地开发

```bash
cp .env.example .env
npm install
npm run dev
```

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin/login
- 默认账号：`huqicheng` / `huqicheng`

数据目录默认：`./data`（数据库与上传文件）

## Docker 部署（腾讯云）

```bash
cp .env.example .env
# 务必修改 SESSION_SECRET，建议同时修改管理员密码
# 若 3000 端口已被占用，在 .env 里设置 APP_PORT=3001（或其他空闲端口）

docker compose up -d --build
```

访问：`http://服务器IP:3001`（端口以 `.env` 中 `APP_PORT` 为准，默认 3001）

反向代理（Nginx）示例：把域名指到 `127.0.0.1:3001` 即可。

### 端口被占用时

```bash
# 查看谁占用了 3000
ss -tlnp | grep 3000

# 在 .env 里改端口后重启
echo "APP_PORT=3001" >> .env
docker compose down
docker compose up -d
```

## 目录说明

```
src/app              页面与 API
src/components       前台组件
src/lib/db           数据库
src/lib/auth         登录会话
src/lib/storage      文件存储抽象（当前 Local，后续可换 COS）
data/                运行时数据（勿提交）
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `SESSION_SECRET` | Cookie 会话密钥（≥32 字符） |
| `ADMIN_USERNAME` | 首次初始化管理员账号 |
| `ADMIN_PASSWORD` | 首次初始化管理员密码 |
| `DATA_DIR` | 数据目录，Docker 中为 `/data` |

> 管理员仅在首次不存在时根据环境变量创建；之后改 `.env` 不会自动改已有密码。
