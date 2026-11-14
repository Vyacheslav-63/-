import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.resolve('.portable-tmp');
const OUT_DIR = path.resolve('downloads');
const OUT_FILE = path.join(OUT_DIR, 'SpeakEasy-English-Offline.html');

async function buildPortable() {
  console.log('Building standalone portable HTML file...');

  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  await build({
    configFile: false,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      outDir: TMP_DIR,
      emptyOutDir: true,
      cssCodeSplit: false,
      assetsInlineLimit: 100 * 1024 * 1024,
      lib: {
        entry: path.resolve('src/portable.tsx'),
        name: 'SpeakEasyApp',
        formats: ['iife'],
        fileName: () => 'bundle.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  });

  const files = fs.readdirSync(TMP_DIR);
  const jsFile = files.find((f) => f.endsWith('.js'));
  const cssFile = files.find((f) => f.endsWith('.css'));

  if (!jsFile) {
    throw new Error('Portable JS bundle was not generated.');
  }

  const jsCode = fs.readFileSync(path.join(TMP_DIR, jsFile), 'utf8').replace(/<\/script>/gi, '<\\/script>');
  const cssCode = cssFile
    ? fs.readFileSync(path.join(TMP_DIR, cssFile), 'utf8').replace(/<\/style>/gi, '<\\/style>')
    : '';
  const iconSvg = fs.readFileSync(path.resolve('public/icon.svg'), 'utf8');
  const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`;

  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>SpeakEasy English — Автономный тренажер</title>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#10B981" />
    <link rel="icon" type="image/svg+xml" href="${iconDataUri}" />
    <style>${cssCode}</style>
  </head>
  <body class="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#10B981] selection:text-white min-h-screen">
    <div id="root"></div>
    <script>${jsCode}</script>
  </body>
</html>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, html, 'utf8');
  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`Portable app generated: ${OUT_FILE} (${sizeKb} KB)`);
}

buildPortable().catch((err) => {
  console.error('Failed to build portable file:', err);
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  process.exit(1);
});
