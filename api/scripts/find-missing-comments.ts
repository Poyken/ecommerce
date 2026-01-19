import * as fs from 'fs';
import * as path from 'path';

// Using absolute paths based on user corpus description
const rootDir = 'd:/ecommerce-main';
const targetDirs = [
  path.join(rootDir, 'api/src'),
  path.join(rootDir, 'web/features'),
];

const commentMarker = 'GIẢI THÍCH CHO THỰC TẬP SINH';

function checkDir(dir: string) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      checkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (
        file.includes('.spec.') ||
        file.includes('.test.') ||
        file.includes('.dto.')
      )
        continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes(commentMarker)) {
        console.log(fullPath);
      }
    }
  }
}

console.log('--- Missing Comments ---');
targetDirs.forEach(checkDir);
