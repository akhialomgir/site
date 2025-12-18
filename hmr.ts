import { createServer } from 'http';
import { watch, readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';
import { exec } from 'child_process';

const PORT = 3000;
const DIST_DIR = './dist';

function build() {
  exec('npx ts-node build.ts --dev', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ 构建失败:', error.message);
      if (stderr) console.error('stderr:', stderr);
    } else {
      console.log('✅ 构建完成');
      if (stdout.trim()) console.log(stdout);
    }
  });
}

function setupWatchers() {
  const dirsToWatch = ['./src', './components'];

  dirsToWatch.forEach(dir => {
    if (!existsSync(dir)) {
      console.warn(`⚠️  目录不存在: ${dir}`);
      return;
    }

    watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      console.log(`📁 ${dir}/${filename} 已${eventType === 'change' ? '修改' : eventType}`);
      build();
    });

    console.log(`👀 开始监听: ${dir}`);
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

createServer((req, res) => {
  let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = extname(filePath);

  if (!ext && existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath);
      // 🔥 关键：获取文件状态
      const stats = statSync(filePath);
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'text/plain',
        'Cache-Control': 'no-cache',
        'Last-Modified': stats.mtime.toUTCString(),  // 🎯 添加这个
        'ETag': `W/"${stats.size}-${stats.mtime.getTime()}"`  // 🎯 添加这个
      });
      res.end(content);
    } catch (err) {
      res.writeHead(500);
      res.end('服务器错误');
    }
  } else {
    res.writeHead(404);
    res.end('文件未找到');
  }
}).listen(PORT, () => {
  console.log(`🚀 开发服务器运行在 http://localhost:${PORT}`);
  setupWatchers();
  build();
});
