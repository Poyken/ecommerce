import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.join(process.cwd(), "api/src");

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const controllerFiles = getAllFiles(SRC_DIR).filter((f) =>
  f.endsWith(".controller.ts")
);

const endpoints: { method: string; path: string; file: string }[] = [];

controllerFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const controllerMatch = content.match(/@Controller\(['"](.*?)['"]\)/);
  if (!controllerMatch) return;

  const basePath = controllerMatch[1];

  const methodRegex = /@(Get|Post|Patch|Put|Delete)\(['"](.*?)['"]\)/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    let method = match[1].toUpperCase();
    let subPath = match[2];

    // Normalize path
    let fullPath = `/${basePath}/${subPath}`.replace(/\/+/g, "/");
    if (fullPath.endsWith("/")) fullPath = fullPath.slice(0, -1);

    endpoints.push({
      method,
      path: fullPath,
      file: path.relative(SRC_DIR, file),
    });
  }

  // Also check for methods without subpath @Get(), @Post() etc
  const simpleMethodRegex = /@(Get|Post|Patch|Put|Delete)\(\)/g;
  while ((match = simpleMethodRegex.exec(content)) !== null) {
    let method = match[1].toUpperCase();
    let fullPath = `/${basePath}`.replace(/\/+/g, "/");
    if (fullPath.endsWith("/")) fullPath = fullPath.slice(0, -1);
    endpoints.push({
      method,
      path: fullPath,
      file: path.relative(SRC_DIR, file),
    });
  }
});

console.log(JSON.stringify(endpoints, null, 2));
console.log(`Total Endpoints Found: ${endpoints.length}`);
