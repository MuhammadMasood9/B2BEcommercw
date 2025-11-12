#!/usr/bin/env node

/**
 * Cleanup Blue Colors Script
 * Systematically replaces all blue color references with brand colors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BlueColorCleanup {
  constructor() {
    this.replacements = [
      // Basic blue classes
      { from: /bg-blue-(\d+)/g, to: 'bg-primary' },
      { from: /text-blue-(\d+)/g, to: 'text-primary' },
      { from: /border-blue-(\d+)/g, to: 'border-primary' },
      
      // Hover states
      { from: /hover:bg-blue-(\d+)/g, to: 'hover:bg-primary/90' },
      { from: /hover:text-blue-(\d+)/g, to: 'hover:text-primary' },
      { from: /hover:border-blue-(\d+)/g, to: 'hover:border-primary' },
      
      // Focus states
      { from: /focus:bg-blue-(\d+)/g, to: 'focus:bg-primary' },
      { from: /focus:text-blue-(\d+)/g, to: 'focus:text-primary' },
      { from: /focus:border-blue-(\d+)/g, to: 'focus:border-primary' },
      { from: /focus:ring-blue-(\d+)/g, to: 'focus:ring-primary/20' },
      
      // Dark mode
      { from: /dark:bg-blue-(\d+)/g, to: 'dark:bg-primary/20' },
      { from: /dark:text-blue-(\d+)/g, to: 'dark:text-primary' },
      { from: /dark:border-blue-(\d+)/g, to: 'dark:border-primary' },
      
      // Gradients
      { from: /from-blue-(\d+)/g, to: 'from-primary' },
      { from: /to-blue-(\d+)/g, to: 'to-orange-600' },
      { from: /via-blue-(\d+)/g, to: 'via-primary' },
      
      // Specific blue shades to appropriate alternatives
      { from: /blue-50/g, to: 'primary/10' },
      { from: /blue-100/g, to: 'primary/20' },
      { from: /blue-200/g, to: 'orange-200' },
      { from: /blue-300/g, to: 'orange-300' },
      { from: /blue-400/g, to: 'orange-400' },
      { from: /blue-500/g, to: 'primary' },
      { from: /blue-600/g, to: 'primary' },
      { from: /blue-700/g, to: 'orange-700' },
      { from: /blue-800/g, to: 'gray-800' },
      { from: /blue-900/g, to: 'gray-900' },
      
      // Indigo replacements (often used with blue)
      { from: /indigo-(\d+)/g, to: 'orange-600' },
      
      // Specific hex colors that are blue
      { from: /#3B82F6/gi, to: '#FF9900' }, // blue-500
      { from: /#2563EB/gi, to: '#FF9900' }, // blue-600
      { from: /#1D4ED8/gi, to: '#E67E00' }, // blue-700
      { from: /#1E40AF/gi, to: '#CC6600' }, // blue-800
      { from: /#1E3A8A/gi, to: '#1A1A1A' }, // blue-900 -> dark grey
    ];
    
    this.processedFiles = 0;
    this.totalReplacements = 0;
  }

  async processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', '.next'].includes(entry.name)) {
          await this.processDirectory(fullPath);
        }
      } else if (entry.isFile() && this.shouldProcessFile(entry.name)) {
        await this.processFile(fullPath);
      }
    }
  }

  shouldProcessFile(filename) {
    const extensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let fileReplacements = 0;

      for (const replacement of this.replacements) {
        const matches = content.match(replacement.from);
        if (matches) {
          content = content.replace(replacement.from, replacement.to);
          modified = true;
          fileReplacements += matches.length;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.processedFiles++;
        this.totalReplacements += fileReplacements;
        console.log(`✅ Updated ${filePath.replace(process.cwd(), '')} (${fileReplacements} replacements)`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  async run() {
    console.log('🧹 Starting Blue Color Cleanup...\n');
    
    const clientSrcPath = path.join(process.cwd(), 'client', 'src');
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
    
    // Process client source files
    if (fs.existsSync(clientSrcPath)) {
      console.log('Processing client source files...');
      await this.processDirectory(clientSrcPath);
    }
    
    // Process tailwind config
    if (fs.existsSync(tailwindConfigPath)) {
      console.log('Processing Tailwind config...');
      await this.processFile(tailwindConfigPath);
    }
    
    console.log('\n🎉 Blue Color Cleanup Complete!');
    console.log(`📊 Files processed: ${this.processedFiles}`);
    console.log(`🔄 Total replacements: ${this.totalReplacements}`);
  }
}

// Run the cleanup
const cleanup = new BlueColorCleanup();
cleanup.run();