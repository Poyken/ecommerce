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
