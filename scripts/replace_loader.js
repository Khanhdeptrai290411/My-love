const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if not exists
  if (!content.includes("import HeartLoader from '@/components/HeartLoader'")) {
    const importMatch = content.match(/^import .*? from '.*?';?$/m);
    if (importMatch) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + "import HeartLoader from '@/components/HeartLoader'\n" + content.slice(endOfLastImport + 1);
      changed = true;
    }
  }

  // Replace various loading blocks
  const loadingRegex1 = /if \((status === 'loading'(\s*\|\|\s*[a-zA-Z]+Loading)?)\) \{\s*return \(\s*<div className="min-h-screen flex items-center justify-center [^"]+">\s*<div className="[^"]+">Đang tải...<\/div>\s*<\/div>\s*\)\s*\}/g;

  if (loadingRegex1.test(content)) {
    content = content.replace(loadingRegex1, (match, condition) => {
      return `if (${condition}) {\n    return <HeartLoader />\n  }`;
    });
    changed = true;
  }

  // Extra case for review/page.tsx inner loading
  const reviewLoading = /isLoading \? \(\s*<div className="text-center py-12 text-gray-800">Đang tải...<\/div>\s*\)/;
  if (reviewLoading.test(content)) {
    content = content.replace(reviewLoading, `isLoading ? (\n            <div className="text-center py-12 text-foreground/50 animate-pulse font-medium">Đang chờ phép màu...</div>\n          )`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(appDir);
