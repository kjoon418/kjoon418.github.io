import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { buildSite } from './build.mjs';

const { values } = parseArgs({ options: { public: { type: 'boolean' } } });
const output = await buildSite({ preview: !values.public });
const host = '127.0.0.1';
const port = 4173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let url;
  let pathname;
  try {
    url = new URL(request.url, `http://${host}:${port}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (/[\\\0]/.test(pathname)) {
    response.writeHead(400).end();
    return;
  }

  let file = resolve(output, `.${pathname}`);
  const location = relative(output, file);
  if (location === '..' || location.startsWith(`..${sep}`)) {
    response.writeHead(400).end();
    return;
  }

  let status = 200;
  let body;
  try {
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        const redirect = `/${url.pathname.replace(/^\/+/, '')}/${url.search}`;
        response.writeHead(301, { Location: redirect }).end();
        return;
      }
      file = join(file, 'index.html');
    }
    body = await readFile(file);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
      response.writeHead(500).end();
      return;
    }
    status = 404;
    file = join(output, '404.html');
    body = await readFile(file).catch(() => Buffer.from('Not Found'));
  }

  response.writeHead(status, {
    'Content-Type': types[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  }).end(request.method === 'HEAD' ? undefined : body);
});

server.listen(port, host, () => console.log(`Local: http://${host}:${port}/`));
