# PriceHunt Chrome Extension

A powerful Chrome extension that helps you find the best prices across multiple retailers instantly. Compare prices while you shop and never overpay again!

## 🚀 Features

- **Auto Product Detection**: Automatically detects products on supported retailer websites
- **Real-time Price Comparison**: Instantly compares prices across major retailers
- **Smart Notifications**: Get notified when better prices are found
- **Easy Price Overlay**: View price comparisons without leaving the page
- **Search History**: Keep track of your price searches
- **Privacy Focused**: All data stored locally, no tracking

## 🛍️ Supported Retailers

- Amazon
- eBay
- Walmart
- Target
- Best Buy
- Apple
- PlayStation Store
- Newegg
- Costco

## 📦 Installation

### Method 1: Load Unpacked Extension (Development)

1. **Enable Developer Mode**:

   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

2. **Load the Extension**:

   - Click "Load unpacked"
   - Select the `chrome-extension` folder from this project
   - The extension should now appear in your extensions list

3. **Pin the Extension**:
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "PriceHunt - Price Comparison" and click the pin icon

### Method 2: Create Icons (Required for proper display)

The extension currently uses SVG icons. For best compatibility, convert them to PNG:

```bash
# Install ImageMagick (macOS)
brew install imagemagick

# Convert icons (run from chrome-extension directory)
./convert-icons.sh
```

Or use online tools like [favicon.io](https://favicon.io) to convert the SVG files to PNG.

## 🎯 Usage

### Basic Usage

1. **Visit a Product Page**: Navigate to any product page on a supported retailer
2. **Click the Extension**: Click the PriceHunt icon in your toolbar
3. **Compare Prices**: View price comparisons and click to visit other retailers
4. **Save Money**: Choose the best deal and complete your purchase

### Advanced Features

#### Price Overlay

- Better prices are automatically displayed as an overlay on product pages
- Click any alternative to visit that retailer

#### Settings Customization

- Right-click the extension icon and select "Options"
- Customize notifications, auto-detection, and supported stores
- Set minimum savings threshold for notifications

#### Search History

- View your price comparison history
- Clear history from the options page for privacy

## ⚙️ Configuration

### Default Settings

- **Auto-detect products**: Enabled
- **Show notifications**: Enabled
- **Minimum savings**: $10
- **All stores**: Enabled

### Customization Options

- Toggle auto-detection on/off
- Enable/disable notifications
- Set minimum savings threshold
- Select which stores to include in comparisons
- Clear search history

## 🔧 Development

### Project Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html/css/js      # Extension popup interface
├── background.js          # Background service worker
├── content.js/css         # Content scripts for web pages
├── options.html/css/js    # Settings page
├── overlay.html           # Price comparison overlay
├── icons/                 # Extension icons
└── README.md             # This file
```

### Key Components

#### Background Service Worker (`background.js`)

- Manages extension lifecycle
- Handles cross-tab communication
- Manages context menus and notifications
- Stores user preferences

#### Content Script (`content.js`)

- Detects products on retailer websites
- Extracts product information
- Injects price comparison overlays
- Communicates with background script

#### Popup Interface (`popup.html`)

- Main extension interface
- Shows detected products
- Triggers price comparisons
- Quick access to app features

#### Options Page (`options.html`)

- Extension settings and preferences
- Store selection and customization
- Privacy controls and data management

### API Integration

The extension communicates with the PriceHunt backend API:

```javascript
// Price comparison endpoint
POST http://localhost:8080/api/scrape
{
  "url": "https://example.com/product",
  "fromExtension": true
}
```

### Local Development

1. **Start the PriceHunt app**:

   ```bash
   npm run dev
   ```

2. **Load the extension** in Chrome (see installation steps above)

3. **Test on supported sites** like Amazon, eBay, Walmart, etc.

4. **Check the console** for any errors or debugging information

## 🛠️ Troubleshooting

### Common Issues

#### Extension not detecting products

- Ensure you're on a supported retailer website
- Check that auto-detection is enabled in settings
- Refresh the page and try again

#### Price comparison not working

- Verify the PriceHunt app is running (`npm run dev`)
- Check browser console for API errors
- Ensure the backend is accessible at `localhost:8080`

#### Icons not displaying

- Convert SVG icons to PNG format
- Reload the extension after adding PNG icons
- Check file permissions in the icons directory

### Debug Mode

Enable debug logging by opening the browser console:

1. Right-click on any page → "Inspect"
2. Go to the "Console" tab
3. Look for PriceHunt extension logs

### Permissions

The extension requires these permissions:

- `activeTab`: Access current tab information
- `storage`: Store user preferences locally
- `cookies`: Access retailer cookies for better product detection
- `scripting`: Inject content scripts for product detection

## 🔒 Privacy & Security

- **Local Storage**: All data is stored locally in your browser
- **No Tracking**: We don't track your browsing or shopping habits
- **Secure API**: All API calls use HTTPS (in production)
- **Minimal Permissions**: Only requests necessary permissions

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Documentation**: Visit the main PriceHunt app for detailed guides
- **Issues**: Report bugs through the GitHub issues page
- **Feature Requests**: Suggest new features via GitHub discussions

## 🚀 Roadmap

- [ ] Support for more international retailers
- [ ] Price history tracking and alerts
- [ ] Mobile app integration
- [ ] Wishlist and price drop notifications
- [ ] Browser sync across devices
- [ ] Advanced filtering and sorting options

---

**Happy Shopping with PriceHunt!** 🛍️💰
