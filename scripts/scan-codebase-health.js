const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

const issues = {
  emptyHrefs: [],
  emptyHandlers: [],
  todos: [],
  fixmes: [],
  fakeMocks: [],
};

const srcDir = path.join(__dirname, '..', 'src');

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const relPath = path.relative(path.join(__dirname, '..'), filePath);

    if (/href=["']#["']/.test(line)) {
      issues.emptyHrefs.push({ file: relPath, line: lineNum, text: line.trim() });
    }
    if (/onClick=\{?\s*\(\s*\)\s*=>\s*\{\s*\}?\s*\}?/.test(line)) {
      issues.emptyHandlers.push({ file: relPath, line: lineNum, text: line.trim() });
    }
    if (/\bTODO\b/i.test(line) && !line.includes('// TODO: none')) {
      issues.todos.push({ file: relPath, line: lineNum, text: line.trim() });
    }
    if (/\bFIXME\b/i.test(line)) {
      issues.fixmes.push({ file: relPath, line: lineNum, text: line.trim() });
    }
    if (/\bfake(Data|Products|Orders|Stats)\b/i.test(line)) {
      issues.fakeMocks.push({ file: relPath, line: lineNum, text: line.trim() });
    }
  });
});

console.log('====================================================');
console.log('CODEBASE QUALITY & PLACEHOLDER AUDIT REPORT');
console.log('====================================================\n');

console.log(`1. Dead / Empty hrefs (href="#"): ${issues.emptyHrefs.length}`);
issues.emptyHrefs.forEach((i) => console.log(`   - ${i.file}:${i.line} -> ${i.text}`));

console.log(`\n2. Empty onClick Handlers: ${issues.emptyHandlers.length}`);
issues.emptyHandlers.forEach((i) => console.log(`   - ${i.file}:${i.line} -> ${i.text}`));

console.log(`\n3. TODO markers: ${issues.todos.length}`);
issues.todos.forEach((i) => console.log(`   - ${i.file}:${i.line} -> ${i.text}`));

console.log(`\n4. FIXME markers: ${issues.fixmes.length}`);
issues.fixmes.forEach((i) => console.log(`   - ${i.file}:${i.line} -> ${i.text}`));

console.log(`\n5. Fake / Mock Identifiers: ${issues.fakeMocks.length}`);
issues.fakeMocks.forEach((i) => console.log(`   - ${i.file}:${i.line} -> ${i.text}`));

console.log('\nAudit complete.');

