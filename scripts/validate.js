#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const projectRoot = path.join(__dirname, '..');

async function validateManifest() {
  console.log(chalk.blue('🔍 Validating manifest.json...'));
  
  const manifestPath = path.join(projectRoot, 'manifest.json');
  
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    const validations = [
      {
        name: 'Required fields',
        test: () => {
          const required = ['name', 'version', 'manifest_version', 'description'];
          const missing = required.filter(field => !manifest[field]);
          return { pass: missing.length === 0, message: missing.length ? `Missing: ${missing.join(', ')}` : 'All required fields present' };
        }
      },
      {
        name: 'Manifest version',
        test: () => ({
          pass: manifest.manifest_version === 3,
          message: manifest.manifest_version === 3 ? 'Using Manifest V3' : 'Should use Manifest V3'
        })
      },
      {
        name: 'Name length',
        test: () => ({
          pass: manifest.name && manifest.name.length <= 45,
          message: `Name length: ${manifest.name ? manifest.name.length : 0}/45 characters`
        })
      },
      {
        name: 'Description length',
        test: () => ({
          pass: manifest.description && manifest.description.length <= 132,
          message: `Description length: ${manifest.description ? manifest.description.length : 0}/132 characters`
        })
      },
      {
        name: 'Icons',
        test: () => {
          const hasIcons = manifest.icons && 
            manifest.icons['16'] && 
            manifest.icons['48'] && 
            manifest.icons['128'];
          return {
            pass: hasIcons,
            message: hasIcons ? 'Required icon sizes present' : 'Missing required icon sizes (16, 48, 128)'
          };
        }
      },
      {
        name: 'Version format',
        test: () => {
          const validFormat = /^\d+(\.\d+){0,3}$/.test(manifest.version);
          return {
            pass: validFormat,
            message: validFormat ? 'Valid version format' : 'Version should be in format: 1.2.3.4'
          };
        }
      },
      {
        name: 'No comments',
        test: () => {
          // Look for JavaScript/CSS style comments, excluding URLs
          const contentWithoutUrls = manifestContent.replace(/https?:\/\/[^\s"]+/g, '');
          const hasComments = contentWithoutUrls.includes('//') || contentWithoutUrls.includes('/*');
          return {
            pass: !hasComments,
            message: hasComments ? 'Contains comments (not allowed in Chrome Web Store)' : 'No comments found'
          };
        }
      }
    ];
    
    let allPassed = true;
    
    for (const validation of validations) {
      const result = validation.test();
      if (result.pass) {
        console.log(chalk.green(`  ✓ ${validation.name}: ${result.message}`));
      } else {
        console.log(chalk.red(`  ✗ ${validation.name}: ${result.message}`));
        allPassed = false;
      }
    }
    
    console.log('');
    if (allPassed) {
      console.log(chalk.green('✅ Manifest validation passed!'));
    } else {
      console.log(chalk.red('❌ Manifest validation failed!'));
    }
    
    return allPassed;
    
  } catch (error) {
    console.error(chalk.red('✗ Error validating manifest:'), error.message);
    return false;
  }
}

async function validateFiles() {
  console.log(chalk.blue('📁 Validating extension files...'));
  
  const requiredFiles = [
    'manifest.json',
    'src/inject/inject.js',
    'src/inject/inject.css',
    'src/jquery.js',
    'icons/trello-tile-16.png',
    'icons/trello-tile-48.png',
    'icons/trello-tile-128.png',
    '_locales/en/messages.json'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    const exists = await fs.pathExists(filePath);
    
    if (exists) {
      const stats = await fs.stat(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(chalk.green(`  ✓ ${file} (${sizeKB} KB)`));
    } else {
      console.log(chalk.red(`  ✗ ${file} - MISSING`));
      allFilesExist = false;
    }
  }
  
  console.log('');
  if (allFilesExist) {
    console.log(chalk.green('✅ All required files present!'));
  } else {
    console.log(chalk.red('❌ Some required files are missing!'));
  }
  
  return allFilesExist;
}

async function validateIcons() {
  console.log(chalk.blue('🖼️ Validating icons...'));
  
  const iconSizes = [
    { file: 'icons/trello-tile-16.png', expectedSize: 16 },
    { file: 'icons/trello-tile-48.png', expectedSize: 48 },
    { file: 'icons/trello-tile-128.png', expectedSize: 128 }
  ];
  
  let allIconsValid = true;
  
  for (const icon of iconSizes) {
    const iconPath = path.join(projectRoot, icon.file);
    const exists = await fs.pathExists(iconPath);
    
    if (exists) {
      const stats = await fs.stat(iconPath);
      const sizeKB = Math.round(stats.size / 1024);
      
      if (sizeKB > 0) {
        console.log(chalk.green(`  ✓ ${icon.file} (${sizeKB} KB)`));
      } else {
        console.log(chalk.yellow(`  ⚠ ${icon.file} - File exists but appears empty`));
        allIconsValid = false;
      }
    } else {
      console.log(chalk.red(`  ✗ ${icon.file} - MISSING`));
      allIconsValid = false;
    }
  }
  
  console.log('');
  if (allIconsValid) {
    console.log(chalk.green('✅ All icons are valid!'));
  } else {
    console.log(chalk.red('❌ Some icons are missing or invalid!'));
  }
  
  return allIconsValid;
}

async function validateExtension() {
  try {
    console.log(chalk.bold.blue('🔍 Validating Chrome Extension...'));
    console.log('');
    
    const manifestValid = await validateManifest();
    const filesValid = await validateFiles();
    const iconsValid = await validateIcons();
    
    console.log(chalk.blue('📊 Validation summary:'));
    console.log(chalk.cyan(`  Manifest: ${manifestValid ? 'PASS' : 'FAIL'}`));
    console.log(chalk.cyan(`  Files: ${filesValid ? 'PASS' : 'FAIL'}`));
    console.log(chalk.cyan(`  Icons: ${iconsValid ? 'PASS' : 'FAIL'}`));
    
    const allValid = manifestValid && filesValid && iconsValid;
    
    console.log('');
    if (allValid) {
      console.log(chalk.green('✅ Extension validation passed!'));
      console.log(chalk.yellow('💡 Ready to build and package for Chrome Web Store'));
    } else {
      console.log(chalk.red('❌ Extension validation failed!'));
      console.log(chalk.yellow('💡 Fix the issues above before building'));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Validation failed:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  validateExtension();
}

module.exports = { validateExtension };