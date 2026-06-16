# 智慧农业一体化管理平台

一个面向智慧农业场景的全栈项目，集成了病虫害识别、环境监测、温室管理、农资采购与库存管理，以及基于大模型的农业智能问答能力。

项目当前采用三层架构：

- 前端：`Vue 3 + TypeScript + Vite + Element Plus + Pinia + ECharts`
- 业务后端：`Spring Boot + MyBatis Plus + MySQL`
- AI 服务：`Flask + Ultralytics YOLO + OpenCV + Socket.IO`

## 项目亮点

- 支持病虫害图片识别、视频识别、摄像头实时识别
- 内置病虫害知识库与识别记录管理
- 包含温室信息、环境监测、数据大屏等农业管理场景
- 提供农资采购和库存管理功能
- 集成智谱 GLM 接口，用于农业问答与辅助分析
- 支持文件上传、识别结果落库、天气接口查询等业务流程

## 系统架构

```text
Vue 3 前端
  ├─ 页面与可视化展示
  ├─ 病虫害检测交互
  ├─ 智能问答
  └─ 通过 /api、/flask 代理访问后端

Spring Boot 业务后端
  ├─ 用户、病害、温室、库存、采购等 REST API
  ├─ 文件上传与静态文件访问
  ├─ 识别记录落库
  └─ 天气接口聚合

Flask AI 服务
  ├─ YOLO 图片识别
  ├─ YOLO 视频/摄像头检测
  ├─ Socket.IO 推送识别进度
  └─ 结果回传 Spring Boot
```

## 功能模块

- 用户认证：登录、注册、角色路由控制
- 首页与数据大屏：农业数据概览、图表可视化
- 智能温室：温室信息管理、作物信息展示
- 环境监测：环境指标展示与分析
- 病虫害知识库：病害数据查询、详情查看
- 智能识别：图片识别、视频识别、摄像头识别
- 识别记录：图片、视频、摄像头识别历史记录
- 农资管理：采购管理、库存管理
- 智能助手：基于 GLM 的农业问答
- 个人中心与用户管理：资料维护、头像上传、管理员功能

## 仓库结构

```text
.
├─ README.md
├─ .gitignore
└─ xiaotiao/
   ├─ Vue/                     # 前端项目
   │  ├─ src/
   │  │  ├─ api/
   │  │  ├─ components/
   │  │  ├─ layout/
   │  │  ├─ router/
   │  │  ├─ stores/
   │  │  ├─ theme/
   │  │  ├─ utils/
   │  │  └─ views/
   │  ├─ public/
   │  ├─ .env.example          # 环境变量模板
   │  ├─ package.json
   │  └─ vite.config.ts
   ├─ SpringBoot/              # Java 后端
   │  ├─ src/main/java/com/example/Ece/
   │  │  ├─ common/
   │  │  ├─ controller/
   │  │  ├─ entity/
   │  │  └─ mapper/
   │  ├─ src/main/resources/application.properties
   │  └─ pom.xml
   ├─ Flask/                   # Python AI 服务
   │  ├─ main.py
   │  ├─ predict/
   │  └─ yolo11.yaml
   └─ cropdisease.sql          # MySQL 初始化数据
```

## 主要技术栈

### 前端

- Vue 3
- TypeScript
- Vite 4
- Element Plus
- Pinia
- Vue Router
- ECharts
- Socket.IO Client
- markdown-it

### 后端

- Spring Boot 2.3.7
- MyBatis / MyBatis Plus
- MySQL 8
- Hutool
- Maven Wrapper

### AI 服务

- Flask
- Flask-SocketIO
- Ultralytics YOLO
- OpenCV
- Requests

## 运行环境

- Node.js `>= 16`
- npm `>= 7`
- JDK `1.8`
- Maven `3.6+` 或使用仓库内 `mvnw`
- Python `3.8+`
- MySQL `8.x`
- 可选：`ffmpeg`，用于视频转码

## 本地启动

### 1. 初始化数据库

将 `xiaotiao/cropdisease.sql` 导入本地 MySQL，默认数据库名为 `cropdisease`。

Spring Boot 默认数据库配置位于 `xiaotiao/SpringBoot/src/main/resources/application.properties`：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cropdisease?serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=123456
server.port=9999
```

请根据你的本地环境修改账号、密码和端口。

### 2. 启动 Spring Boot

```bash
cd xiaotiao/SpringBoot
./mvnw spring-boot:run
```

Windows 下也可以使用：

```bash
mvnw.cmd spring-boot:run
```

默认服务地址：`http://localhost:9999`

### 3. 启动 Flask AI 服务

先安装依赖，然后启动：

```bash
cd xiaotiao/Flask
pip install -r requirements.txt
python main.py
```

默认服务地址：`http://localhost:5000`

说明：

- 图片识别接口：`POST /predictImg`
- 视频识别接口：`GET /predictVideo`
- 摄像头识别接口：`GET /predictCamera`
- 模型列表接口：`GET /file_names`

如果需要进行视频识别，请确认本机可用 `ffmpeg`。

### 4. 启动 Vue 前端

```bash
cd xiaotiao/Vue
npm install
npm run dev
```

Vite 配置见 `xiaotiao/Vue/vite.config.ts`。开发环境下前端会代理：

- `/api` -> `http://localhost:9999`
- `/flask` -> `http://localhost:5000`

前端端口由 `VITE_PORT` 控制；如果未额外配置，通常为 Vite 默认端口。

## 环境变量配置

前端中使用了智谱 GLM 接口，复制 `.env.example` 为 `.env` 并填写实际值：

```bash
cp xiaotiao/Vue/.env.example xiaotiao/Vue/.env
```

必填配置项：

- `VITE_GLM_API_KEY`：智谱 GLM API Key（智能助手依赖）
- `VITE_API_URL`：后端接口地址

说明：

- 智能助手页面和部分分析能力依赖 GLM API
- 当前部分页面也存在直接写死 `http://localhost:9999` 的请求，部署时建议统一抽取为环境变量

## 关键接口

### Spring Boot

- `/flask/predict`：转发图片识别请求，并保存识别记录
- `/flask/file_names`：获取 Flask 可用模型列表
- `/files/upload`：上传文件，返回可访问 URL
- `/files/{flag}`：下载或访问上传文件
- `/weather/now`：查询天气信息

### Flask

- `/predictImg`：图片识别
- `/predictVideo`：视频流识别
- `/predictCamera`：摄像头实时识别
- `/stopCamera`：停止摄像头识别
- `/file_names`：列出权重文件

## 已识别的业务对象

从代码与数据库样例来看，系统至少已经覆盖以下业务数据：

- 用户
- 病虫害知识库
- 温室信息
- 图片识别记录
- 视频识别记录
- 摄像头识别记录
- 采购记录
- 库存记录

数据库样例还显示项目已接入多种作物病害识别，如玉米、水稻、小麦、番茄、苹果、葡萄、草莓、棉花等场景。

## GitHub 展示建议

这个仓库已经具备作为毕业设计、竞赛作品或作品集项目展示的基础。为了让 GitHub 首页更完整，后续还建议补充：

- 系统截图或 GIF 演示
- 部署地址或演示视频链接
- `requirements.txt` 与 `.env.example`
- 默认测试账号说明
- 训练模型说明与数据集来源

## 当前项目中值得注意的地方

- 前端和文档中的部分配置存在旧值或占位值，需要按实际部署环境清理
- 天气接口和大模型调用中有硬编码配置，公开仓库前建议改为环境变量
- 视频识别依赖本地 `ffmpeg` 和模型权重文件，若缺失会影响完整运行

## License

前端子项目 `xiaotiao/Vue` 内包含 `LICENSE` 文件。

如需对外开源，建议在仓库根目录补一份统一的许可证说明。
