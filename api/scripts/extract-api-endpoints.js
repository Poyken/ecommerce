// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// API ENDPOINT EXTRACTION SCRIPT - TOOL TỰ ĐỘNG HÓA TÀI LIỆU
// =================================================================================================
//
// Script này quét toàn bộ source code (`src/`) để tìm và liệt kê tất cả API Endpoints.
// Nó hoạt động bằng cách phân tích tĩnh (Static Analysis) các file `.controller.ts`.
//
// CƠ CHẾ HOẠT ĐỘNG (REGEX PARSING):
// 1. Tìm các file `*.controller.ts`.
// 2. Đọc nội dung file, tìm decorator `@Controller('path')` để lấy base path.
// 3. Tìm các decorator method `@Get`, `@Post`, `@Put`... để lấy HTTP method và sub-path.
// 4. Kết hợp lại thành full endpoint URL (ví dụ: `POST /api/v1/auth/login`).
//
// MỤC ĐÍCH:
// - Tạo ra file `API_ENDPOINTS_CATALOG.json` dùng để tham khảo nhanh.
// - Giúp Frontend Dev biết Backend có những API nào mà không cần đọc từng file code.
// - Kiểm toán (Audit) xem có endpoint nào bị thừa hoặc path đặt tên chưa chuẩn không.
// ================================================================================================= 
// API Endpoint Extraction Script
// Run: node scripts/extract-api-endpoints.js

const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../src');
const endpoints = [];

function extractEndpoints(filePath, content) {
  const controllerMatch = content.match(/@Controller\(['"]([^'"]*)['"]\)/);
  const basePath = controllerMatch ? controllerMatch[1] : '';
  
  const methodRegex = /@(Get|Post|Put|Patch|Delete)\(['"]?([^'")\s]*)?['"]?\)/g;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const match = methodRegex.exec(line);
    if (match) {
      const method = match[1].toUpperCase();
      let route = match[2] || '';
      
      // Get the function name from next few lines
      let funcName = '';
      for (let i = index + 1; i < Math.min(index + 5, lines.length); i++) {
        const funcMatch = lines[i].match(/async\s+(\w+)\s*\(/);
        if (funcMatch) {
          funcName = funcMatch[1];
          break;
        }
      }
      
      const fullPath = `/${basePath}${route ? '/' + route.replace(/^\//, '') : ''}`;
      
      endpoints.push({
        method,
        path: fullPath.replace(/\/\//g, '/'),
        controller: path.basename(filePath),
        function: funcName
      });
    }
  });
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.controller.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      extractEndpoints(filePath, content);
    }
  });
}

scanDirectory(controllersDir);

console.log('Total endpoints found:', endpoints.length);
console.log('\n=== API ENDPOINTS ===\n');
console.log(JSON.stringify(endpoints, null, 2));

// Group by controller
const byController = endpoints.reduce((acc, ep) => {
  if (!acc[ep.controller]) acc[ep.controller] = [];
  acc[ep.controller].push(ep);
  return acc;
}, {});

console.log('\n=== BY CONTROLLER ===\n');
Object.keys(byController).sort().forEach(controller => {
  console.log(`\n${controller} (${byController[controller].length} endpoints)`);
  byController[controller].forEach(ep => {
    console.log(`  ${ep.method.padEnd(6)} ${ep.path}`);
  });
});

// Save to file
fs.writeFileSync(
  path.join(__dirname, '../API_ENDPOINTS_CATALOG.json'),
  JSON.stringify(endpoints, null, 2)
);

console.log('\n✅ Saved to API_ENDPOINTS_CATALOG.json');
