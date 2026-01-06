/**
 * =====================================================================
 * CHECK & UPDATE INTERN COMMENTS SCRIPT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Script này có 2 chức năng chính:
 * 1. SCAN: Quét toàn bộ project để tìm các file TypeScript/TSX thiếu comment hướng dẫn cho thực tập sinh
 * 2. UPDATE: Tự động thêm comment template vào đầu các file thiếu
 *
 * Cách sử dụng:
 *   npx ts-node scripts/check-intern-comments.ts [--fix]
 *
 *   --fix: Tự động thêm comment vào các file thiếu
 *
 * Tiêu chí file cần có comment:
 * - Các file .ts, .tsx trong src/ (API) hoặc các thư mục chính (Web)
 * - Loại trừ: node_modules, .next, dist, test files, index.ts (barrel exports)
 * =====================================================================
 */

import * as fs from 'fs';
import * as path from 'path';

// =====================================================================
// CẤU HÌNH
// =====================================================================

const INTERN_COMMENT_PATTERN = /GIẢI THÍCH CHO THỰC TẬP SINH/i;

// Các thư mục cần quét
const SCAN_DIRECTORIES = [
  'src', // API
  'features', // Web
  'lib', // Web
  'components', // Web
  'actions', // Web
  'providers', // Web
  'services', // Web
];

// Các file/thư mục cần bỏ qua
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  '.git',
  'coverage',
  '__tests__',
  '.spec.ts',
  '.test.ts',
  '.e2e-spec.ts',
  'index.ts', // Barrel exports thường không cần comment chi tiết
  '.d.ts', // Type definitions
  '.config.ts', // Config files
  '.config.mjs',
];

// Template comment cho các loại file khác nhau
const COMMENT_TEMPLATES = {
  service: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.TS', ' SERVICE')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Service này chịu trách nhiệm xử lý logic nghiệp vụ.
 *
 * 1. NHIỆM VỤ CHÍNH:
 *    - [Mô tả chức năng chính của service]
 *
 * 2. CÁC PHƯƠNG THỨC QUAN TRỌNG:
 *    - [Liệt kê các method chính]
 *
 * 3. LƯU Ý KHI SỬ DỤNG:
 *    - [Các lưu ý quan trọng]
 * =====================================================================
 */

`,

  controller: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.TS', ' CONTROLLER')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này xử lý các HTTP request từ client.
 *
 * 1. NHIỆM VỤ CHÍNH:
 *    - Nhận request từ client
 *    - Validate dữ liệu đầu vào
 *    - Gọi service xử lý logic
 *    - Trả về response cho client
 *
 * 2. CÁC ENDPOINT:
 *    - [Liệt kê các endpoint]
 * =====================================================================
 */

`,

  module: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.TS', ' MODULE')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này đóng gói các thành phần liên quan lại với nhau.
 *
 * 1. CẤU TRÚC MODULE:
 *    - imports: Các module khác cần sử dụng
 *    - controllers: Các controller xử lý request
 *    - providers: Các service cung cấp logic
 *    - exports: Các service cho module khác sử dụng
 * =====================================================================
 */

`,

  dto: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.DTO.TS', ' DTO (DATA TRANSFER OBJECT)')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DTO định nghĩa cấu trúc dữ liệu truyền giữa các layer.
 *
 * 1. MỤC ĐÍCH:
 *    - Validate dữ liệu đầu vào
 *    - Định nghĩa kiểu dữ liệu cho request/response
 *    - Tách biệt dữ liệu API với database entity
 *
 * 2. DECORATORS SỬ DỤNG:
 *    - @IsString(), @IsNumber()...: Validate kiểu dữ liệu
 *    - @IsOptional(): Field không bắt buộc
 *    - @ApiProperty(): Tài liệu Swagger
 * =====================================================================
 */

`,

  component: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.TSX', ' COMPONENT')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component React này render UI cho người dùng.
 *
 * 1. PROPS:
 *    - [Mô tả các props nhận vào]
 *
 * 2. STATE/HOOKS:
 *    - [Mô tả các state và hooks sử dụng]
 *
 * 3. CÁCH SỬ DỤNG:
 *    - [Ví dụ cách import và sử dụng component]
 * =====================================================================
 */

`,

  hook: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.TS', ' HOOK')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Custom Hook này đóng gói logic tái sử dụng.
 *
 * 1. MỤC ĐÍCH:
 *    - [Mô tả chức năng của hook]
 *
 * 2. CÁCH SỬ DỤNG:
 *    - [Ví dụ cách sử dụng]
 *
 * 3. GIÁ TRỊ TRẢ VỀ:
 *    - [Mô tả các giá trị hook trả về]
 * =====================================================================
 */

`,

  action: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase().replace('.TS', ' SERVER ACTIONS')}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Server Actions - Các hàm chạy trên server được gọi từ client.
 *
 * 1. ĐẶC ĐIỂM:
 *    - Chạy trên server (không expose code cho client)
 *    - Có thể gọi trực tiếp từ React component
 *    - Tự động xử lý form submission
 *
 * 2. CÁC ACTION:
 *    - [Liệt kê các action trong file]
 * =====================================================================
 */

`,

  default: (fileName: string) => `/**
 * =====================================================================
 * ${fileName.toUpperCase()}
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * [Mô tả ngắn gọn mục đích của file]
 *
 * 1. CHỨC NĂNG:
 *    - [Mô tả các chức năng chính]
 *
 * 2. CÁCH SỬ DỤNG:
 *    - [Hướng dẫn sử dụng]
 * =====================================================================
 */

`,
};

// =====================================================================
// FUNCTIONS
// =====================================================================

interface FileReport {
  path: string;
  hasComment: boolean;
  suggestedType: keyof typeof COMMENT_TEMPLATES;
}

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(
    (pattern) => filePath.includes(pattern) || filePath.endsWith(pattern),
  );
}

function getFileType(fileName: string): keyof typeof COMMENT_TEMPLATES {
  if (fileName.includes('.service.')) return 'service';
  if (fileName.includes('.controller.')) return 'controller';
  if (fileName.includes('.module.')) return 'module';
  if (fileName.includes('.dto.')) return 'dto';
  if (fileName.startsWith('use-') || fileName.startsWith('use')) return 'hook';
  if (fileName.includes('action')) return 'action';
  if (fileName.endsWith('.tsx')) return 'component';
  return 'default';
}

function hasInternComment(content: string): boolean {
  return INTERN_COMMENT_PATTERN.test(content);
}

function scanDirectory(dir: string, files: FileReport[] = []): FileReport[] {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, files);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
    ) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const hasComment = hasInternComment(content);

      files.push({
        path: fullPath,
        hasComment,
        suggestedType: getFileType(entry.name),
      });
    }
  }

  return files;
}

function addCommentToFile(
  filePath: string,
  fileType: keyof typeof COMMENT_TEMPLATES,
): void {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const template = COMMENT_TEMPLATES[fileType](fileName);

  // Check if file starts with 'use client' or 'use server'
  const directiveMatch = content.match(/^(['"]use (client|server)['"];?\s*\n)/);

  let newContent: string;
  if (directiveMatch) {
    // Insert comment after the directive
    newContent =
      directiveMatch[0] +
      '\n' +
      template +
      content.slice(directiveMatch[0].length);
  } else {
    // Insert comment at the beginning
    newContent = template + content;
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
}

// =====================================================================
// MAIN EXECUTION
// =====================================================================

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const projectRoot = process.cwd();

  console.log('🔍 Scanning for files missing intern comments...\n');
  console.log(`📁 Project root: ${projectRoot}`);
  console.log(`🔧 Fix mode: ${shouldFix ? 'ENABLED' : 'DISABLED'}\n`);

  const allFiles: FileReport[] = [];

  for (const dir of SCAN_DIRECTORIES) {
    const fullDir = path.join(projectRoot, dir);
    if (fs.existsSync(fullDir)) {
      console.log(`📂 Scanning: ${dir}/`);
      scanDirectory(fullDir, allFiles);
    }
  }

  const filesWithComment = allFiles.filter((f) => f.hasComment);
  const filesMissingComment = allFiles.filter((f) => !f.hasComment);

  console.log('\n' + '='.repeat(60));
  console.log('📊 SCAN RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Files WITH intern comments: ${filesWithComment.length}`);
  console.log(
    `❌ Files MISSING intern comments: ${filesMissingComment.length}`,
  );
  console.log(`📄 Total files scanned: ${allFiles.length}`);

  if (filesMissingComment.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 FILES MISSING COMMENTS:');
    console.log('='.repeat(60));

    for (const file of filesMissingComment) {
      const relativePath = path.relative(projectRoot, file.path);
      console.log(`  ❌ ${relativePath} [${file.suggestedType}]`);

      if (shouldFix) {
        try {
          addCommentToFile(file.path, file.suggestedType);
          console.log(`     ✅ Added comment template`);
        } catch (error) {
          console.log(`     ⚠️ Failed to add comment: ${error}`);
        }
      }
    }

    if (!shouldFix) {
      console.log(
        '\n💡 TIP: Run with --fix flag to automatically add comment templates:',
      );
      console.log('   npx ts-node scripts/check-intern-comments.ts --fix');
    }
  } else {
    console.log('\n🎉 All files have intern comments!');
  }

  // Write report to file
  const reportPath = path.join(projectRoot, 'intern-comments-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: allFiles.length,
    filesWithComments: filesWithComment.length,
    filesMissingComments: filesMissingComment.length,
    missingFiles: filesMissingComment.map((f) => ({
      path: path.relative(projectRoot, f.path),
      suggestedType: f.suggestedType,
    })),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

main().catch(console.error);
