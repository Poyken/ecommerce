
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SEARCH_DIRS = [
  path.join(ROOT_DIR, 'api', 'src'),
  path.join(ROOT_DIR, 'web', 'app'),
  path.join(ROOT_DIR, 'web', 'features'),
];

const EXCLUDE_EXTENSIONS = ['.spec.ts', '.test.ts', '.e2e-spec.ts', '.d.ts', '.map'];
const EXCLUDE_FILES = ['global.d.ts']; 
// Refined exclusion: exclude Data Transfer Objects and simple Types as they are self-explanatory
const EXCLUDE_PATTERNS = ['.dto.ts', '.entity.ts', '.module.ts', '.types.ts', '.interface.ts', '.schema.prisma'];

const MIN_LINES = 30;
const REQUIRED_PHRASE = "GIẢI THÍCH CHO THỰC TẬP SINH";

let missingCount = 0;
let checkedCount = 0;

function shouldScan(filePath) {
  const filename = path.basename(filePath);
  
  // Check extensions
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(filePath))) return false;
  
  // Check exclusions
  if (EXCLUDE_EXTENSIONS.some(ext => filename.endsWith(ext))) return false;
  if (EXCLUDE_FILES.includes(filename)) return false;
  if (EXCLUDE_PATTERNS.some(pattern => filename.includes(pattern))) return false;
  
  return true;
}

function scanDirectory(directory) {
  if (!fs.existsSync(directory)) return;

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
        scanDirectory(fullPath);
    } else if (shouldScan(fullPath)) {
        checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (lines.length < MIN_LINES) return; // Skip small files

    checkedCount++;

    if (!content.includes(REQUIRED_PHRASE)) {
        missingCount++;
        const relativePath = path.relative(ROOT_DIR, filePath);
        console.log(`[MISSING] ${relativePath} (${lines.length} lines)`);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

console.log("🔍 Starting Audit for 'GIẢI THÍCH CHO THỰC TẬP SINH'...");
SEARCH_DIRS.forEach(dir => {
    console.log(`Scanning: ${dir}`);
    scanDirectory(dir);
});

console.log("\n---------------------------------------------------");
console.log(`✅ Scan Complete.`);
console.log(`Checked Files (> ${MIN_LINES} lines): ${checkedCount}`);
console.log(`Files Missing Explanation: ${missingCount}`);
console.log("---------------------------------------------------");
