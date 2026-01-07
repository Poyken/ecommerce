const fs = require('fs');
const path = require('path');

const CONFIG = {
  roots: [
    { dir: 'api/src', ext: /\.(ts)$/ },
    { dir: 'web/app', ext: /\.(ts|tsx)$/ },
    { dir: 'web/components', ext: /\.(ts|tsx)$/ },
    { dir: 'web/features', ext: /\.(ts|tsx)$/ },
    { dir: 'web/lib', ext: /\.(ts|tsx)$/ },
    { dir: 'web/providers', ext: /\.(ts|tsx)$/ },
    { dir: 'web/actions', ext: /\.(ts|tsx)$/ },
    { dir: 'web/services', ext: /\.(ts|tsx)$/ },
  ],
  keyword: 'thực tập sinh',
  ignore: [/node_modules/, /\.next/, /dist/],
};

function getAllFiles(dirPath, extRegex, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!CONFIG.ignore.some(re => re.test(fullPath))) {
        getAllFiles(fullPath, extRegex, arrayOfFiles);
      }
    } else {
      if (extRegex.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function checkComments() {
  console.log('🚀 Đang kiểm tra comment "thực tập sinh" trong toàn bộ dự án...\n');
  
  let totalFiles = 0;
  let filesWithComment = 0;
  const missingFiles = [];

  CONFIG.roots.forEach(root => {
    const rootPath = path.join(process.cwd(), root.dir);
    if (!fs.existsSync(rootPath)) return;

    const files = getAllFiles(rootPath, root.ext);
    files.forEach(file => {
      totalFiles++;
      const content = fs.readFileSync(file, 'utf8');
      if (content.toLowerCase().includes(CONFIG.keyword.toLowerCase())) {
        filesWithComment++;
      } else {
        missingFiles.push(path.relative(process.cwd(), file));
      }
    });
  });

  const percentage = totalFiles > 0 ? (filesWithComment / totalFiles * 100).toFixed(2) : 0;

  console.log('--- KẾT QUẢ KIỂM TRA ---');
  console.log(`✅ Tổng số file: ${totalFiles}`);
  console.log(`📝 File đã có comment: ${filesWithComment}`);
  console.log(`❌ File còn thiếu: ${missingFiles.length}`);
  console.log(`📊 Tỷ lệ hoàn thành: ${percentage}%\n`);

  if (missingFiles.length > 0) {
    console.log('--- DANH SÁCH FILE CÒN THIẾU ---');
    // Chỉ log 20 file đầu tiên nếu quá nhiều
    const displayCount = 50;
    missingFiles.slice(0, displayCount).forEach(file => {
      console.log(`- ${file}`);
    });
    
    if (missingFiles.length > displayCount) {
      console.log(`... và ${missingFiles.length - displayCount} file khác.`);
    }
  } else {
    console.log('🎉 Tuyệt vời! 100% file đã có comment giải thích cho thực tập sinh.');
  }
}

checkComments();
