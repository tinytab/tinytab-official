# AGENTS.md

TinyTab 的网站源码（GitHub Pages 静态站点），与 App 安装包一起发布在公开仓库 `tinytab/tinytab-official`。买家在购买页提交电邮、支付方式与交易单号；订单受理、许可证签发与激活由 Univo 许可中心完成，审批在 Univo 的控制台中操作。本仓库没有服务端代码，也不含任何签发入口。

## 不可违反的约束

- **不含机密**：网站源码与构建产物都会公开。Turnstile 私密密钥与 Univo 的签名私钥都不得进入本仓库，也不得添加签发许可证的页面或接口。
- **网络边界**：页面只访问许可中心的主、备用接口。`vite.config.ts` 在构建产物中注入 CSP，`connect-src` 放行 `VITE_API_PRIMARY` 与 `VITE_API_BACKUP` 的源，不得放宽。依赖一律从 npm 安装并随站点打包，不引用 CDN。例外只有两个 Cloudflare 服务，它们只能从 Cloudflare 自己的域名加载：购买页的 Turnstile（`challenges.cloudflare.com`，放行 `script-src` 与 `frame-src`），以及 Web Analytics（脚本来自 `static.cloudflareinsights.com`，上报到 `cloudflareinsights.com`，放行 `script-src` 与 `connect-src`；只在构建产物中注入，开发服务器不上报）。不再增加其他第三方。
- **Turnstile 密钥**：站点密钥公开，写在 `.env.development`（与 Univo 预发布环境共用的组件）与 `.env.production`；对应的私密密钥只存在于 Univo 的服务端环境，不得写入本仓库。
- **不存储**：不使用 Cookie、localStorage、sessionStorage 或 IndexedDB。手动选择的界面语言只写在网址参数 `?lang=` 里，参考 `src/i18n/index.ts`。购买表单的电邮与交易单号只随提交发送给许可中心。
- **公开契约**：
  - 哈希路由 `#/purchase` 由应用直接链接（应用的 `LicenseConfiguration`），不可更改。
  - 下载链接 `src/config.ts` 的 `DOWNLOAD_URL` 指向公开仓库最新 Release 中名为 `TinyTab.dmg` 的附件；每次发布 App 都必须用这个文件名。
  - 网站只调用一个接口：`POST /v1/tinytab/site/orders`。请求体字段为 `email`、`offering`、`paymentMethod`、`transactionNumber`、`humanToken`，售卖项固定 `pro`；支付方式映射 `usdtTrc20 → usdt-trc20`、`usdtErc20 → usdt-erc20`。
  - 明确拒绝（`human_verification_failed`、`offering_not_on_sale`、`payment_method_unavailable`、`payment_already_processed`）以及 HTTP 400（表单校验错误）、403 `origin_not_allowed` 是最终结果；只有主接口不可达、超时、5xx、429 或响应无法识别时才尝试备用接口。
  - 订单字段的校验定义在 `src/lib/order.ts`，购买页与测试共用。

## 目录职责

- `src/lib/`：纯函数，不依赖 React（`clipboard.ts`、`theme.ts` 除外），由 `test/` 覆盖。
- `src/pages/`：每个功能页面一个文件，在 `src/pages/registry.ts` 注册后出现在导航与首页；首页是 `src/pages/home.tsx`。
- `src/i18n/`、`src/locales/`：界面多语言。`zh-CN.json` 是源文件；`zh-Hant.json` 由 `pnpm locales:hant` 逐字转换生成，不手改；其他语言文件的键与源文件一致，由 `test/locales.test.ts` 检查。
- `src/components/ui/`：shadcn/ui（Base UI）生成的组件，不做格式化和 lint。
- `public/`：原样复制到构建产物根目录的文件，目前只有 GitHub Pages 的自定义域 `CNAME`。
- `scripts/`：`verify-build.mjs` 在构建后检查产物，`locales-hant*.mjs` 生成繁体中文。
- `.github/workflows/`：`ci.yml` 运行检查，`deploy.yml` 构建并发布到 GitHub Pages。

## 技术约定

- 技术栈与 `hongzhao` 项目保持一致：React 19、Vite 8、Tailwind CSS v4（设计令牌在 `src/index.css` 的 `@theme` 中声明）、shadcn/ui（Base UI）、wouter 哈希路由、`motion/react`、i18next。
- 品牌色为 `brand`，取自应用图标的靛蓝色；默认深色主题。
- class 合并使用 `import { cn } from 'cn'`。
- 界面文案不写在组件里：先加到 `src/locales/zh-CN.json`，同步补齐其他语言文件，再运行 `pnpm locales:hant`。品牌名在所有语言下保持原文。页面引用应用的菜单与按钮时，使用应用中同一语言的原文（应用的 `Sources/TinyTab/Resources/*.lproj/Localizable.strings`）。

## 验证

```sh
pnpm format:check && pnpm lint && pnpm check-types && pnpm test && pnpm build
```

`pnpm build` 产出 `dist/`，并运行 `scripts/verify-build.mjs` 检查 CSP 的 `connect-src` 包含正式接口源、产物不含预发布地址与测试密钥，且 `CNAME` 为 `tinytab.xinlu.ink`。

涉及界面的改动需在浏览器中实际验证，并确认构建产物只向许可中心的主、备用域名发出请求。

## 发布

- 网站：推送到 `main` 触发 `.github/workflows/deploy.yml`，或手动运行该工作流。它运行全部检查与构建，把 `dist/` 上传为 Pages 产物，再用 `actions/deploy-pages` 发布；全程使用仓库自带的 `GITHUB_TOKEN`。不需要 `pages` 分支，也没有本地发布脚本。
- 仓库设置：在 Settings > Pages 把 Source 设为 GitHub Actions，设置自定义域 `tinytab.xinlu.ink` 并启用 HTTPS；关闭 Issues，问题反馈统一指向 `tinytab/feedback`。`public/CNAME` 随构建产物发布。
- App 安装包：每个 Release 必须附上文件名恰为 `TinyTab.dmg` 的附件，README 与网站的下载按钮都指向最新 Release。
- 接口：由 Univo 提供，正式与预发布环境各有一组主、备用地址，分别配置在 `.env.production` 与 `.env.development`。改动订单请求体或支付方式映射后，需要与 Univo 的接口约定同步。
- 域名：网站 `https://tinytab.xinlu.ink/`。该来源必须同时登记在 Univo 的产品资料与 Turnstile 组件中，否则浏览器预检会拒绝提交订单。
