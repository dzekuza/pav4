#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXTENSION_DIR = path.join(__dirname, "chrome-extension");
const BUILD_DIR = path.join(__dirname, "dist", "chrome-extension");

// Files to copy
const FILES_TO_COPY = [
  "manifest.json",
  "background.js",
  "content.js",
  "content.css",
  "popup.html",
  "popup.css",
  "popup.js",
  "sidepanel.html",
  "sidepanel.css",
  "sidepanel.js",
  "options.html",
  "options.css",
  "options.js",
  "overlay.html",
];

// Directories to copy
const DIRS_TO_COPY = ["icons"];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  ensureDir(destDir);
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${path.relative(EXTENSION_DIR, src)}`);
}

function copyDir(src, dest) {
  ensureDir(dest);

  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function buildExtension() {
  console.log("🚀 Building Chrome Extension...\n");

  // Clean build directory
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }

  // Create build directory
  ensureDir(BUILD_DIR);

  // Copy files
  for (const file of FILES_TO_COPY) {
    const srcPath = path.join(EXTENSION_DIR, file);
    const destPath = path.join(BUILD_DIR, file);

    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, destPath);
    } else {
      console.log(`⚠️  Warning: ${file} not found`);
    }
  }

  // Copy directories
  for (const dir of DIRS_TO_COPY) {
    const srcPath = path.join(EXTENSION_DIR, dir);
    const destPath = path.join(BUILD_DIR, dir);

    if (fs.existsSync(srcPath)) {
      copyDir(srcPath, destPath);
    } else {
      console.log(`⚠️  Warning: ${dir} directory not found`);
    }
  }

  // Create README for installation
  const readmeContent = `# PriceHunt Chrome Extension - Built Version

This is the built version of the PriceHunt Chrome Extension.

## Installation

1. Open Chrome and go to \`chrome://extensions/\`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select this folder (\`${BUILD_DIR}\`)
5. The extension should now appear in your extensions list

## Usage

1. Visit any supported retailer website (Amazon, eBay, Walmart, etc.)
2. Click the PriceHunt extension icon in your toolbar
3. Click "Compare Prices" to find better deals
4. View price comparisons and click to visit other retailers

## Supported Sites

- Amazon
- eBay  
- Walmart
- Target
- Best Buy
- Apple
- PlayStation Store
- Newegg
- Costco

## Troubleshooting

- Make sure the PriceHunt app is running at \`https://pavlo4.netlify.app\`
- Check the browser console for any errors
- Ensure you're on a supported retailer website

For more information, visit: https://pavlo4.netlify.app
`;

  fs.writeFileSync(path.join(BUILD_DIR, "README.md"), readmeContent);

  console.log("\n✅ Chrome Extension built successfully!");
  console.log(`📁 Build location: ${BUILD_DIR}`);
  console.log("\n📋 Next steps:");
  console.log("1. Open Chrome and go to chrome://extensions/");
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the build folder');
  console.log("4. Visit a supported retailer and test the extension");
  console.log("\n🎯 Test URLs:");
  console.log("- https://www.amazon.com/dp/B08N5WRWNW");
  console.log("- https://www.ebay.com/itm/example");
  console.log("- https://www.walmart.com/ip/example");
}

// Run the build
buildExtension();
