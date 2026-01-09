// Project Structure Analyzer
// Run: node analyze-structure.js

const fs = require('fs');
const path = require('path');

const results = {
  api: {
    controllers: [],
    services: [],
    modules: [],
    entities: [],
    dtos: [],
    guards: [],
    decorators: [],
    middlewares: [],
    utils: [],
    config: [],
    duplicates: [],
    issues: []
  },
  web: {
    pages: [],
    components: [],
    features: [],
    lib: [],
    hooks: [],
    actions: [],
    types: [],
    styles: [],
    duplicates: [],
    issues: []
  },
  stats: {
    totalFiles: 0,
    totalDirs: 0,
    totalLines: 0,
    apiFiles: 0,
    webFiles: 0
  }
};

function analyzeDirectory(dir, type = 'api') {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist' || item.name === '.next') {
          return;
        }
        results.stats.totalDirs++;
        analyzeDirectory(fullPath, type);
      } else if (item.isFile()) {
        results.stats.totalFiles++;
        
        if (type === 'api') {
          results.stats.apiFiles++;
          categorizeApiFile(fullPath, item.name);
        } else {
          results.stats.webFiles++;
          categorizeWebFile(fullPath, item.name);
        }
        
        // Count lines
        if (item.name.endsWith('.ts') || item.name.endsWith('.tsx') || item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            results.stats.totalLines += content.split('\n').length;
          } catch (e) {}
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
  }
}

function categorizeApiFile(fullPath, filename) {
  const relativePath = fullPath.replace(/\\/g, '/').split('/api/src/')[1] || fullPath;
  
  if (filename.endsWith('.controller.ts')) {
    results.api.controllers.push(relativePath);
  } else if (filename.endsWith('.service.ts')) {
    results.api.services.push(relativePath);
  } else if (filename.endsWith('.module.ts')) {
    results.api.modules.push(relativePath);
  } else if (filename.endsWith('.entity.ts')) {
    results.api.entities.push(relativePath);
  } else if (filename.endsWith('.dto.ts')) {
    results.api.dtos.push(relativePath);
  } else if (filename.endsWith('.guard.ts')) {
    results.api.guards.push(relativePath);
  } else if (filename.endsWith('.decorator.ts') || filename.endsWith('.decorators.ts')) {
    results.api.decorators.push(relativePath);
  } else if (filename.endsWith('.middleware.ts')) {
    results.api.middlewares.push(relativePath);
  } else if (filename.includes('util') || filename.includes('helper')) {
    results.api.utils.push(relativePath);
  } else if (filename.includes('config') || filename.includes('constant')) {
    results.api.config.push(relativePath);
  }
}

function categorizeWebFile(fullPath, filename) {
  const relativePath = fullPath.replace(/\\/g, '/').split('/web/')[1] || fullPath;
  
  if (relativePath.includes('/app/')) {
    results.web.pages.push(relativePath);
  } else if (relativePath.includes('/components/')) {
    results.web.components.push(relativePath);
  } else if (relativePath.includes('/features/')) {
    results.web.features.push(relativePath);
  } else if (relativePath.includes('/lib/')) {
    results.web.lib.push(relativePath);
  } else if (relativePath.includes('/hooks/')) {
    results.web.hooks.push(relativePath);
  } else if (filename.includes('action')) {
    results.web.actions.push(relativePath);
  } else if (relativePath.includes('/types/')) {
    results.web.types.push(relativePath);
  } else if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    results.web.styles.push(relativePath);
  }
}

function detectDuplicates(files) {
  const nameMap = {};
  const duplicates = [];
  
  files.forEach(file => {
    const name = path.basename(file);
    if (!nameMap[name]) {
      nameMap[name] = [];
    }
    nameMap[name].push(file);
  });
  
  Object.entries(nameMap).forEach(([name, paths]) => {
    if (paths.length > 1) {
      duplicates.push({ name, paths, count: paths.length });
    }
  });
  
  return duplicates;
}

function analyzeProject() {
  console.log('🔍 Analyzing project structure...\n');
  
  const apiSrc = path.join(__dirname, '../api/src');
  const webSrc = path.join(__dirname, '../web');
  
  if (fs.existsSync(apiSrc)) {
    analyzeDirectory(apiSrc, 'api');
  }
  
  if (fs.existsSync(webSrc)) {
    analyzeDirectory(webSrc, 'web');
  }
  
  // Detect duplicates
  results.api.duplicates = detectDuplicates([
    ...results.api.controllers,
    ...results.api.services,
    ...results.api.modules
  ]);
  
  results.web.duplicates = detectDuplicates([
    ...results.web.components,
    ...results.web.features
  ]);
  
  // Print results
  console.log('📊 PROJECT STATISTICS\n');
  console.log(`Total Files: ${results.stats.totalFiles}`);
  console.log(`Total Directories: ${results.stats.totalDirs}`);
  console.log(`Total Lines of Code: ${results.stats.totalLines.toLocaleString()}`);
  console.log(`API Files: ${results.stats.apiFiles}`);
  console.log(`Web Files: ${results.stats.webFiles}`);
  
  console.log('\n📁 API STRUCTURE\n');
  console.log(`Controllers: ${results.api.controllers.length}`);
  console.log(`Services: ${results.api.services.length}`);
  console.log(`Modules: ${results.api.modules.length}`);
  console.log(`DTOs: ${results.api.dtos.length}`);
  console.log(`Entities: ${results.api.entities.length}`);
  console.log(`Guards: ${results.api.guards.length}`);
  console.log(`Decorators: ${results.api.decorators.length}`);
  console.log(`Middlewares: ${results.api.middlewares.length}`);
  
  console.log('\n📁 WEB STRUCTURE\n');
  console.log(`Pages: ${results.web.pages.length}`);
  console.log(`Components: ${results.web.components.length}`);
  console.log(`Features: ${results.web.features.length}`);
  console.log(`Lib files: ${results.web.lib.length}`);
  console.log(`Hooks: ${results.web.hooks.length}`);
  console.log(`Actions: ${results.web.actions.length}`);
  console.log(`Types: ${results.web.types.length}`);
  
  console.log('\n⚠️ POTENTIAL ISSUES\n');
  console.log(`API Duplicate Names: ${results.api.duplicates.length}`);
  console.log(`Web Duplicate Names: ${results.web.duplicates.length}`);
  
  if (results.api.duplicates.length > 0) {
    console.log('\nAPI Duplicates:');
    results.api.duplicates.slice(0, 5).forEach(dup => {
      console.log(`  - ${dup.name} (${dup.count} instances)`);
    });
  }
  
  if (results.web.duplicates.length > 0) {
    console.log('\nWeb Duplicates:');
    results.web.duplicates.slice(0, 5).forEach(dup => {
      console.log(`  - ${dup.name} (${dup.count} instances)`);
    });
  }
  
  // Save to file
  fs.writeFileSync(
    path.join(__dirname, '../STRUCTURE_ANALYSIS.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n✅ Analysis complete! Saved to STRUCTURE_ANALYSIS.json');
}

analyzeProject();
