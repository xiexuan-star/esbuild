import express, { RequestHandler, Express } from 'express';
import * as fs from 'fs/promises';
import { renderToString } from 'vue/server-renderer';
import * as path from 'path';
import { ViteDevServer, createServer as createViteServer } from 'vite';

const isProd = process.env.NODE_ENV === 'production';
const cwd = process.cwd();

function matchPageUrl(url: string) {
  return url === '/';
}

function resolveTemplatePath() {
  return isProd ?
    path.join(cwd, 'dist/client/index.html') :
    path.join(cwd, 'index.html');
}

async function fetchData() {
  return { foo: '123' };
}

async function createSsrMiddleware(app: Express): Promise<RequestHandler> {
  let vite: ViteDevServer | null = null;
  if (!isProd) {
    vite = await createViteServer({
      root: cwd,
      server: {
        middlewareMode: 'ssr',
      }
    });
    // 注册 Vite Middlewares
    // 主要用来处理客户端资源
    app.use(vite.middlewares);
  }

  return async (req, res, next) => {
    // SSR 的逻辑
    // 1. 加载服务端入口模块
    const { ServerEntry } = await loadSsrEntryModule(vite);
    // 2. 数据预取
    const data = await fetchData();
    // 3. 「核心」渲染组件
    const appHtml = await renderToString(ServerEntry(data));
    // 4. 拼接 HTML，返回响应
    const url = req.originalUrl;
    const templatePath = resolveTemplatePath();

    let template = await fs.readFile(templatePath, 'utf-8');
    // 开发模式下需要注入 HMR、环境变量相关的代码，因此需要调用 vite.transformIndexHtml
    if (!isProd && vite) {
      template = await vite.transformIndexHtml(url, template);
    }

    const html = template
      .replace('<!-- SSR_APP -->', appHtml)
      // 注入数据标签，用于客户端 hydrate
      .replace(
        '<!-- SSR_DATA -->',
        `<script>window.__SSR_DATA__=${ JSON.stringify(data) }</script>`
      );
    res.status(200).setHeader('Content-Type', 'text/html').end(html);
  };
}

async function loadSsrEntryModule(vite: ViteDevServer | null) {
  // 生产模式下直接 require 打包后的产物
  if (isProd) {
    const entryPath = path.join(cwd, 'dist/server/entry-server.js');
    return require(entryPath);
  }
  // 开发环境下通过 no-bundle 方式加载
  else {
    const entryPath = path.join(cwd, 'src/entry-server.ts');
    return vite!.ssrLoadModule(entryPath);
  }
}


async function createServer() {
  const app = express();

  app.use(await createSsrMiddleware(app));

  app.listen(3000, () => {
    console.log('Node 服务器已启动~');
    console.log('http://localhost:3000');
  });
}

createServer();
