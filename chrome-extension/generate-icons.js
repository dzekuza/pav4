// Simple icon generator for PriceHunt Chrome Extension
// This creates basic SVG icons and provides instructions for PNG conversion

const fs = require("fs");
const path = require("path");

const iconSizes = [16, 32, 48, 128];

// SVG template for the PriceHunt icon
const createIconSVG = (size) =>
  `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="url(#gradient)" stroke="none"/>
  
  <!-- Price tag icon -->
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.003})">
    <!-- Main tag shape -->
    <path d="M20 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" 
          fill="white" opacity="0.9"/>
    
    <!-- Dollar sign -->
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
          font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="url(#gradient)">$</text>
    
    <!-- Trending arrow -->
    <path d="m22 7-8.5 8.5-5-5L2 17" stroke="white" stroke-width="2" 
          fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
    <path d="m16 7 6 0 0 6" stroke="white" stroke-width="2" 
          fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
  </g>
</svg>
`.trim();

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each size
iconSizes.forEach((size) => {
  const svgContent = createIconSVG(size);
  const filename = `icon${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Create a conversion script
const conversionScript = `#!/bin/bash
# Convert SVG icons to PNG
# Requires ImageMagick or Inkscape

echo "Converting SVG icons to PNG..."

for size in 16 32 48 128; do
    echo "Converting icon\${size}.svg to icon\${size}.png"
    
    # Using ImageMagick (install with: brew install imagemagick)
    if command -v convert &> /dev/null; then
        convert -background transparent icons/icon\${size}.svg icons/icon\${size}.png
    
    # Using Inkscape (install with: brew install inkscape)
    elif command -v inkscape &> /dev/null; then
        inkscape --export-type=png --export-filename=icons/icon\${size}.png icons/icon\${size}.svg
    
    # Using rsvg-convert (install with: brew install librsvg)
    elif command -v rsvg-convert &> /dev/null; then
        rsvg-convert -w \${size} -h \${size} icons/icon\${size}.svg > icons/icon\${size}.png
    
    else
        echo "Please install ImageMagick, Inkscape, or librsvg to convert SVG to PNG"
        echo "  brew install imagemagick"
        echo "  brew install inkscape"
        echo "  brew install librsvg"
        exit 1
    fi
done

echo "Icon conversion complete!"
echo "PNG files are now available in the icons/ directory"
`;

fs.writeFileSync(path.join(__dirname, "convert-icons.sh"), conversionScript);
fs.chmodSync(path.join(__dirname, "convert-icons.sh"), "755");

console.log("\n✅ Icon generation complete!");
console.log("\nNext steps:");
console.log("1. Run: chmod +x convert-icons.sh");
console.log("2. Run: ./convert-icons.sh");
console.log(
  "3. Or manually convert the SVG files to PNG using your preferred tool",
);
console.log("\nAlternatively, you can:");
console.log("- Use online tools like favicon.io to convert SVG to PNG");
console.log("- Create custom icons using design software");
console.log(
  "- Use the provided SVG files as-is (some browsers support SVG icons)",
);
