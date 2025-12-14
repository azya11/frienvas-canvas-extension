#!/bin/bash

# Setup script for Canvas Friend Groups Extension

echo "🚀 Setting up Canvas Friend Groups Extension..."

# Create placeholder icons (SVG as fallback)
echo "📦 Creating placeholder icons..."

# Create a simple SVG icon
cat > icons/icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="20" fill="#667eea"/>
  <text x="64" y="64" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial">📚</text>
</svg>
EOF

echo "✅ Icon created (SVG placeholder)"
echo ""
echo "⚠️  Note: For production, you should create proper PNG icons:"
echo "   - icon16.png (16x16)"
echo "   - icon48.png (48x48)"
echo "   - icon128.png (128x128)"
echo ""
echo "   You can use tools like:"
echo "   - https://www.figma.com/"
echo "   - https://www.canva.com/"
echo "   - ImageMagick: convert icon.svg -resize 128x128 icon128.png"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔥 Next steps:"
echo ""
echo "1. Configure Firebase:"
echo "   - Update firebase-config.js with your Firebase credentials"
echo "   - Get them from: https://console.firebase.google.com/"
echo ""
echo "2. Build the extension:"
echo "   npm run build"
echo ""
echo "3. Load in Chrome:"
echo "   - Open chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'dist' folder"
echo ""
echo "4. Get Canvas API token:"
echo "   - Canvas → Account → Settings → New Access Token"
echo ""
echo "📚 See README.md for detailed instructions"
echo "✨ Setup complete!"
