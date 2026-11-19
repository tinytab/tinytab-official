import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type Plugin, defineConfig, loadEnv } from 'vite';
import { codeInspectorPlugin } from 'code-inspector-plugin';

/**
 * Scripts, styles and fonts load only from the site itself, and the only network endpoints the pages may reach are
 * the license center's primary and backup origins. Two Cloudflare services are the exceptions, since Cloudflare
 * serves them only from its own origins:
 * - Turnstile on the purchase page: script and frame from `challenges.cloudflare.com`.
 * - Web Analytics: the beacon script from `static.cloudflareinsights.com`, which reports page views to
 *   `cloudflareinsights.com`. It sets no cookies and collects no personal data.
 * GitHub Pages cannot set response headers, so the policy ships as a <meta> tag; `frame-ancestors` and reporting are
 * not available that way. Inline styles stay allowed because React style props set them.
 */
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
const ANALYTICS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
const ANALYTICS_REPORT_ORIGIN = 'https://cloudflareinsights.com';
/** Site token of the Cloudflare Web Analytics site `tinytab.xinlu.ink`. Public: it only identifies the site. */
const ANALYTICS_TOKEN = 'c4f227adba834045a465202df0c6f40a';

function contentSecurityPolicy(apiOrigins: readonly string[]): Plugin {
  const policy = [
    "default-src 'none'",
    `script-src 'self' ${TURNSTILE_ORIGIN} ${ANALYTICS_SCRIPT_ORIGIN}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${apiOrigins.join(' ')} ${ANALYTICS_REPORT_ORIGIN}`,
    `frame-src ${TURNSTILE_ORIGIN}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');

  return {
    name: 'content-security-policy',
    // Built pages only: the dev server needs inline scripts for hot reload, and must not report page views.
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
      {
        tag: 'script',
        attrs: {
          defer: true,
          src: `${ANALYTICS_SCRIPT_ORIGIN}/beacon.min.js`,
          'data-cf-beacon': JSON.stringify({ token: ANALYTICS_TOKEN, spa: true }),
        },
        injectTo: 'body',
      },
    ],
  };
}

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Reads an API origin from the environment; the build needs both, or the CSP would block a fallback. */
function apiOrigin(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not set: configure the license center origins in the matching .env file.`);
  }
  return new URL(value).origin;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiOrigins = [
    apiOrigin(env.VITE_API_PRIMARY, 'VITE_API_PRIMARY'),
    apiOrigin(env.VITE_API_BACKUP, 'VITE_API_BACKUP'),
  ];

  return {
    // Relative asset paths, so the same build runs under a GitHub Pages subpath, a custom domain or a LAN address.
    base: './',
    plugins: [
      /**
       * https://inspector.fe-dev.cn/guide/start.html
       * 必须位于 React 插件之前，才能在 JSX 转换前注入源码定位信息。
       * 按 Option/Alt + Shift + 鼠标点击 DOM 元素，即可在 IDE 中打开对应的源代码位置。
       */
      codeInspectorPlugin({
        bundler: 'vite',
        injectTo: [entry('./src/main.tsx')],
      }),

      react(),
      tailwindcss(),
      contentSecurityPolicy(apiOrigins),
    ],
    resolve: {
      alias: { '@': entry('./src') },
    },
    build: {
      // Images and fonts ship as separate files, never as inline data URIs.
      assetsInlineLimit: 0,
    },
  };
});
