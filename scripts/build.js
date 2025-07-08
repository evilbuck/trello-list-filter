#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// Files and directories to include in the build
const filesToCopy = [
  'manifest.json',
  'src/',
  'icons/',
  '_locales/'
];

// Files to exclude (will be filtered out)
const excludePatterns = [
  '.git',
  'node_modules',
  'package.json',
  'package-lock.json',
  'README.md',
  'CLAUDE.md',
  'prettier.config.js',
  'scripts/',
  'js/', // old directory
  'css/', // old directory
  'background.js', // old file
  '.buildignore'
];

async function cleanDist() {
  console.log(chalk.yellow('🧹 Cleaning dist directory...'));
  await fs.remove(distDir);
  await fs.ensureDir(distDir);
}

async function copyFiles() {
  console.log(chalk.blue('📁 Copying extension files...'));
  
  for (const file of filesToCopy) {
    const sourcePath = path.join(projectRoot, file);
    const destPath = path.join(distDir, file);
    
    try {
      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        await fs.copy(sourcePath, destPath, {
          filter: (src) => {
            const relativePath = path.relative(projectRoot, src);
            return !excludePatterns.some(pattern => 
              relativePath.includes(pattern)
            );
          }
        });
        console.log(chalk.green(`✓ Copied directory: ${file}`));
      } else {
        await fs.copy(sourcePath, destPath);
        console.log(chalk.green(`✓ Copied file: ${file}`));
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow(`⚠ File not found, skipping: ${file}`));
      } else {
        console.error(chalk.red(`✗ Error copying ${file}:`, error.message));
      }
    }
  }
}

async function validateManifest() {
  console.log(chalk.blue('🔍 Validating manifest...'));
  
  const manifestPath = path.join(distDir, 'manifest.json');
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // Basic validation
    const requiredFields = ['name', 'version', 'manifest_version', 'description'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      console.error(chalk.red('✗ Missing required manifest fields:'), missingFields);
      process.exit(1);
    }
    
    // Check for comments (not allowed in Chrome Web Store)
    // Look for JavaScript/CSS style comments, excluding URLs
    const contentWithoutUrls = manifestContent.replace(/https?:\/\/[^\s"]+/g, '');
    if (contentWithoutUrls.includes('//') || contentWithoutUrls.includes('/*')) {
      console.error(chalk.red('✗ Manifest contains comments, which are not allowed'));
      process.exit(1);
    }
    
    console.log(chalk.green('✓ Manifest validation passed'));
    console.log(chalk.cyan(`  Name: ${manifest.name}`));
    console.log(chalk.cyan(`  Version: ${manifest.version}`));
    console.log(chalk.cyan(`  Manifest Version: ${manifest.manifest_version}`));
    
  } catch (error) {
    console.error(chalk.red('✗ Manifest validation failed:'), error.message);
    process.exit(1);
  }
}

async function checkRequiredFiles() {
  console.log(chalk.blue('📋 Checking required files...'));
  
  const requiredFiles = [
    'manifest.json',
    'src/inject/inject.js',
    'src/inject/inject.css',
    'src/jquery.js',
    'icons/trello-tile-16.png',
    'icons/trello-tile-48.png',
    'icons/trello-tile-128.png'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    const exists = await fs.pathExists(filePath);
    
    if (exists) {
      console.log(chalk.green(`✓ ${file}`));
    } else {
      console.log(chalk.red(`✗ ${file} - MISSING`));
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.error(chalk.red('✗ Some required files are missing'));
    process.exit(1);
  }
}

async function showBuildSummary() {
  console.log(chalk.blue('📊 Build summary:'));
  
  const distStats = await fs.stat(distDir);
  const files = await fs.readdir(distDir, { recursive: true });
  
  console.log(chalk.cyan(`  Output directory: ${distDir}`));
  console.log(chalk.cyan(`  Total files: ${files.length}`));
  console.log(chalk.green('✅ Build completed successfully!'));
  console.log(chalk.yellow('💡 Next steps:'));
  console.log(chalk.yellow('   - Run `npm run package` to create Chrome Web Store ZIP'));
  console.log(chalk.yellow('   - Or load `dist/` folder in Chrome Extensions developer mode'));
}

async function build() {
  try {
    console.log(chalk.bold.blue('🚀 Building Chrome Extension...'));
    console.log('');
    
    await cleanDist();
    await copyFiles();
    await validateManifest();
    await checkRequiredFiles();
    await showBuildSummary();
    
  } catch (error) {
    console.error(chalk.red('❌ Build failed:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  build();
}

module.exports = { build };