#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const chalk = require('chalk');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const releasesDir = path.join(projectRoot, 'releases');

async function ensureDirectories() {
  await fs.ensureDir(releasesDir);
  
  // Check if dist directory exists
  const distExists = await fs.pathExists(distDir);
  if (!distExists) {
    console.error(chalk.red('✗ dist/ directory not found. Run `npm run build` first.'));
    process.exit(1);
  }
}

async function getVersionFromManifest() {
  const manifestPath = path.join(distDir, 'manifest.json');
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    return manifest.version;
  } catch (error) {
    console.error(chalk.red('✗ Error reading manifest version:'), error.message);
    process.exit(1);
  }
}

async function createZip(version) {
  const zipFileName = `trello-list-filter-v${version}.zip`;
  const zipPath = path.join(releasesDir, zipFileName);
  
  console.log(chalk.blue('📦 Creating Chrome Web Store package...'));
  console.log(chalk.cyan(`  Output: ${zipPath}`));
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(chalk.green(`✓ ZIP created: ${zipFileName}`));
      console.log(chalk.cyan(`  Size: ${sizeInMB} MB`));
      resolve(zipPath);
    });
    
    archive.on('error', (err) => {
      console.error(chalk.red('✗ ZIP creation failed:'), err.message);
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add all files from dist directory
    archive.directory(distDir, false);
    
    archive.finalize();
  });
}

async function validateZipContents(zipPath) {
  console.log(chalk.blue('🔍 Validating ZIP contents...'));
  
  // Basic validation - check if ZIP exists and has reasonable size
  const stats = await fs.stat(zipPath);
  const sizeInKB = Math.round(stats.size / 1024);
  
  if (sizeInKB < 10) {
    console.error(chalk.red('✗ ZIP file seems too small (< 10KB)'));
    process.exit(1);
  }
  
  if (sizeInKB > 50000) { // 50MB limit for Chrome Web Store
    console.warn(chalk.yellow('⚠ ZIP file is quite large (> 50MB). Chrome Web Store has size limits.'));
  }
  
  console.log(chalk.green('✓ ZIP validation passed'));
}

async function showPackageSummary(zipPath, version) {
  console.log(chalk.blue('📊 Package summary:'));
  
  const stats = await fs.stat(zipPath);
  const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(chalk.cyan(`  Extension: Trello List Filter`));
  console.log(chalk.cyan(`  Version: ${version}`));
  console.log(chalk.cyan(`  Package: ${path.basename(zipPath)}`));
  console.log(chalk.cyan(`  Size: ${sizeInMB} MB`));
  console.log(chalk.cyan(`  Location: ${zipPath}`));
  
  console.log('');
  console.log(chalk.green('✅ Package ready for Chrome Web Store!'));
  console.log('');
  console.log(chalk.yellow('💡 Next steps:'));
  console.log(chalk.yellow('   1. Go to https://chrome.google.com/webstore/devconsole'));
  console.log(chalk.yellow('   2. Upload the ZIP file'));
  console.log(chalk.yellow('   3. Fill in store listing details'));
  console.log(chalk.yellow('   4. Submit for review'));
}

async function checkChromeWebStoreRequirements() {
  console.log(chalk.blue('✅ Chrome Web Store requirements check:'));
  
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  
  const checks = [
    {
      name: 'Manifest Version 3',
      pass: manifest.manifest_version === 3,
      message: 'Using Manifest V3 (recommended)'
    },
    {
      name: 'Extension Name',
      pass: manifest.name && manifest.name.length <= 45,
      message: 'Name should be ≤ 45 characters'
    },
    {
      name: 'Description',
      pass: manifest.description && manifest.description.length <= 132,
      message: 'Description should be ≤ 132 characters'
    },
    {
      name: 'Icons',
      pass: manifest.icons && manifest.icons['16'] && manifest.icons['48'] && manifest.icons['128'],
      message: 'Required icon sizes: 16x16, 48x48, 128x128'
    },
    {
      name: 'Version Format',
      pass: /^\d+(\.\d+){0,3}$/.test(manifest.version),
      message: 'Version should be in format: 1.2.3.4'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    if (check.pass) {
      console.log(chalk.green(`  ✓ ${check.name}`));
    } else {
      console.log(chalk.red(`  ✗ ${check.name} - ${check.message}`));
      allPassed = false;
    }
  }
  
  if (!allPassed) {
    console.log(chalk.yellow('⚠ Some requirements failed. Consider fixing them before submission.'));
  }
  
  return allPassed;
}

async function packageExtension() {
  try {
    console.log(chalk.bold.blue('📦 Packaging Chrome Extension for Web Store...'));
    console.log('');
    
    await ensureDirectories();
    const version = await getVersionFromManifest();
    await checkChromeWebStoreRequirements();
    
    const zipPath = await createZip(version);
    await validateZipContents(zipPath);
    await showPackageSummary(zipPath, version);
    
  } catch (error) {
    console.error(chalk.red('❌ Packaging failed:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  packageExtension();
}

module.exports = { packageExtension };