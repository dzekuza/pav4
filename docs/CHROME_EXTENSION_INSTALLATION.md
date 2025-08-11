# 🚀 PriceHunt Chrome Extension - Installation Guide

## 📋 Prerequisites

1. **Chrome Browser**: Make sure you have Google Chrome installed
2. **PriceHunt Backend**: The backend server is running at `https://pavlo4.netlify.app`
3. **Extension Files**: The extension has been built and is ready for installation

## 🔧 Installation Steps

### Step 1: Build the Chrome Extension

Build the extension (if not already done):

```bash
npm run build:extension
```

This creates the extension files in `dist/chrome-extension/`

### Step 2: Load the Extension in Chrome

1. **Open Chrome Extensions Page**:

   - Open Chrome
   - Go to `chrome://extensions/`
   - Or navigate to: Chrome Menu → More Tools → Extensions

2. **Enable Developer Mode**:

   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**:

   - Click "Load unpacked"
   - Navigate to your project directory
   - Select the `dist/chrome-extension` folder
   - Click "Select Folder"

4. **Verify Installation**:
   - The PriceHunt extension should now appear in your extensions list
   - You should see the extension icon in your Chrome toolbar

### Step 3: Pin the Extension (Optional)

1. Click the puzzle piece icon in the Chrome toolbar
2. Find "PriceHunt - Price Comparison"
3. Click the pin icon to keep it visible

## 🎯 Testing the Extension

### Test on Supported Retailers

Visit any of these supported retailer websites:

- **Amazon**: https://www.amazon.com/dp/B08N5WRWNW
- **eBay**: Any product page
- **Walmart**: Any product page
- **Target**: Any product page
- **Best Buy**: Any product page
- **Apple**: Any product page
- **PlayStation Store**: Any product page
- **Newegg**: Any product page
- **Costco**: Any product page

### How to Use

1. **Navigate to a Product Page**: Visit any product page on a supported retailer
2. **Click the Extension Icon**: Click the PriceHunt icon in your toolbar
3. **Detect Product**: The extension will automatically detect the product
4. **Compare Prices**: Click "Compare Prices" to find better deals
5. **View Results**: See price comparisons and click to visit other retailers

## 🔍 Features

### Auto-Detection

- Automatically detects products on supported retailer websites
- Shows product information in the extension popup
- Updates badge icon to indicate product detection

### Price Comparison

- Compares prices across multiple retailers
- Shows savings and alternative options
- Direct links to other retailers

### Search History

- Tracks your price comparison searches
- Accessible through the extension popup

### Settings

- Customize notifications and auto-detection
- Set minimum savings threshold
- Choose which stores to include

## 🛠️ Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear in Chrome
**Solution**:

- Make sure Developer mode is enabled
- Check that you selected the correct folder (`dist/chrome-extension`)
- Try refreshing the extensions page

### Product Not Detected

**Problem**: Extension shows "No product detected"
**Solution**:

- Ensure you're on a supported retailer website
- Refresh the page and try again
- Check the browser console for errors

### Price Comparison Not Working

**Problem**: "Failed to compare prices" error
**Solution**:

- Verify the backend server is running at `https://pavlo4.netlify.app`
- Check the browser console for API errors
- Ensure the product URL is accessible

### Icons Not Displaying

**Problem**: Extension icon appears as a puzzle piece
**Solution**:

- The extension uses SVG icons which should work in modern Chrome
- If issues persist, convert SVG to PNG using online tools

### Permission Errors

**Problem**: Extension shows permission errors
**Solution**:

- The extension requires minimal permissions for functionality
- Check that all permissions are granted in Chrome settings

## 🔧 Development

### Making Changes

1. **Edit Source Files**: Modify files in `chrome-extension/` directory
2. **Rebuild Extension**: Run `npm run build:extension`
3. **Reload Extension**: Go to `chrome://extensions/` and click the reload button

### Debug Mode

1. **Open Developer Tools**: Right-click on any page → "Inspect"
2. **Check Console**: Look for PriceHunt extension logs
3. **Extension Debug**: Go to `chrome://extensions/` → Click "Details" → "Inspect views"

## 📱 Supported Features

### Product Detection

- ✅ Amazon product pages
- ✅ eBay product pages
- ✅ Walmart product pages
- ✅ Target product pages
- ✅ Best Buy product pages
- ✅ Apple product pages
- ✅ PlayStation Store pages
- ✅ Newegg product pages
- ✅ Costco product pages
- ✅ Generic e-commerce sites

### Price Comparison

- ✅ Real-time price fetching
- ✅ Multiple retailer comparison
- ✅ Savings calculation
- ✅ Direct retailer links
- ✅ Price history (when available)

### User Experience

- ✅ Auto-detection on page load
- ✅ Context menu integration
- ✅ Badge notifications
- ✅ Search history tracking
- ✅ Settings customization

## 🚀 Quick Start Checklist

- [ ] Extension built with `npm run build:extension`
- [ ] Extension loaded in Chrome (`chrome://extensions/`)
- [ ] Developer mode enabled
- [ ] Extension pinned to toolbar (optional)
- [ ] Tested on a supported retailer website

## 🎉 Success!

Once you've completed the installation and testing, you should be able to:

1. Visit any supported retailer website
2. See the PriceHunt extension icon in your toolbar
3. Click the icon to see detected product information
4. Click "Compare Prices" to find better deals
5. View price comparisons and click to visit other retailers

**Happy Shopping with PriceHunt!** 🛍️💰
