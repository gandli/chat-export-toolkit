/**
 * 简易测试服务器
 * 
 * 用途：在本地启动 HTTP 服务器，用于测试 test-integration.html
 * 
 * 使用方法：
 * bun run scripts/serve-test.ts
 * 
 * 然后访问：http://localhost:3000/test-integration.html
 */

import { serve } from 'bun';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🚀 启动测试服务器...\n');

const server = serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 根路径重定向到测试页
    if (pathname === '/') {
      return new Response(null, {
        status: 302,
        headers: { Location: '/test-integration.html' },
      });
    }

    // 静态文件服务
    const filePath = join(rootDir, pathname);
    
    try {
      const file = Bun.file(filePath);
      if (file.exists) {
        const mimeType = getMimeType(pathname);
        return new Response(file, {
          headers: {
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (e) {
      // 文件不存在，继续处理
    }

    return new Response('Not Found', { status: 404 });
  },
});

function getMimeType(pathname: string): string {
  if (pathname.endsWith('.html')) return 'text/html';
  if (pathname.endsWith('.js')) return 'application/javascript';
  if (pathname.endsWith('.json')) return 'application/json';
  if (pathname.endsWith('.css')) return 'text/css';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.gif')) return 'image/gif';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}

console.log(`✅ 服务器已启动`);
console.log(`📍 访问：http://localhost:${server.port}`);
console.log(`📄 测试页：http://localhost:${server.port}/test-integration.html`);
console.log(`\n按 Ctrl+C 停止服务器\n`);
