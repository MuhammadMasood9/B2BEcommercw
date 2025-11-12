#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Theme-aware classes that should be used consistently
const THEME_CLASSES = {
  backgrounds: ['bg-background', 'bg-card', 'bg-muted'],
  text: ['text-foreground', 'text-muted-foreground', 'text-card-foreground'],
  borders: ['border-border', 'border-card-border'],
  transitions: ['theme-transition'],
  buttons: ['btn-brand-primary', 'btn-brand-secondary', 'btn-brand-outline'],
  inputs: ['input-brand'],
  focus: ['focus-brand', 'focus-brand-grey'],
  links: ['text-brand-link', 'hover:text-brand-link-hover']
};

// Legacy classes that should be replaced
const LEGACY_CLASSES = [
  'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-900',
  'text-gray-900', 'text-gray-600', 'text-gray-700', 'text-gray-800',
  'border-gray-100', 'border-gray-200', 'border-gray-300',
  'brand-card', 'brand-input', 'brand-button-primary', 'brand-text-on-light'
];

function findFilesRecursively(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for legacy classes
  for (const legacyClass of LEGACY_CLASSES) {
    const regex = new RegExp(`className="[^"]*\\b${legacyClass}\\b[^"]*"`, 'g');
    const matches = content.match(regex);
    if (matches) {
      issues.push({
        type: 'legacy_class',
        class: legacyClass,
        count: matches.length,
        examples: matches.slice(0, 3)
      });
    }
  }
  
  // Check for missing theme-transition class
  const hasThemeAwareClasses = Object.values(THEME_CLASSES).flat().some(cls => 
    content.includes(cls)
  );
  
  if (hasThemeAwareClasses && !content.includes('theme-transition')) {
    issues.push({
      type: 'missing_transition',
      message: 'File uses theme-aware classes but missing theme-transition'
    });
  }
  
  // Check for hardcoded colors
  const hardcodedColorRegex = /(bg|text|border)-(white|black|gray-\d+|blue-\d+|red-\d+|green-\d+|yellow-\d+|purple-\d+|pink-\d+|indigo-\d+)/g;
  const hardcodedColors = content.match(hardcodedColorRegex);
  if (hardcodedColors) {
    const uniqueColors = [...new Set(hardcodedColors)];
    if (uniqueColors.length > 0) {
      issues.push({
        type: 'hardcoded_colors',
        colors: uniqueColors.slice(0, 5),
        count: hardcodedColors.length
      });
    }
  }
  
  return issues;
}

function main() {
  console.log('🎨 Verifying Theme Consistency...\n');
  
  const pageFiles = findFilesRecursively('client/src/pages', '.tsx');
  const componentFiles = findFilesRecursively('client/src/components', '.tsx');
  const allFiles = [...pageFiles, ...componentFiles];
  
  let totalIssues = 0;
  const fileResults = [];
  
  for (const file of allFiles) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      fileResults.push({ file, issues });
    }
  }
  
  // Report results
  if (totalIssues === 0) {
    console.log('✅ All files are using consistent theme classes!');
    console.log(`📊 Analyzed ${allFiles.length} files`);
  } else {
    console.log(`❌ Found ${totalIssues} theme consistency issues in ${fileResults.length} files:\n`);
    
    for (const { file, issues } of fileResults) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📄 ${relativePath}:`);
      
      for (const issue of issues) {
        switch (issue.type) {
          case 'legacy_class':
            console.log(`  ⚠️  Legacy class "${issue.class}" used ${issue.count} times`);
            if (issue.examples.length > 0) {
              console.log(`     Examples: ${issue.examples[0]}`);
            }
            break;
          case 'missing_transition':
            console.log(`  ⚠️  ${issue.message}`);
            break;
          case 'hardcoded_colors':
            console.log(`  ⚠️  Hardcoded colors found (${issue.count} total): ${issue.colors.join(', ')}`);
            break;
        }
      }
      console.log('');
    }
    
    console.log('💡 Recommendations:');
    console.log('   • Replace legacy classes with theme-aware equivalents');
    console.log('   • Add "theme-transition" class to elements using theme colors');
    console.log('   • Use semantic color tokens instead of hardcoded colors');
    console.log('   • Refer to the design system documentation for proper classes');
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   • Files analyzed: ${allFiles.length}`);
  console.log(`   • Files with issues: ${fileResults.length}`);
  console.log(`   • Total issues: ${totalIssues}`);
  
  // Exit with error code if issues found
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();

export { analyzeFile, THEME_CLASSES, LEGACY_CLASSES };