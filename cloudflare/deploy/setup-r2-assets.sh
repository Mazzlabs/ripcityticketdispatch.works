#!/bin/bash

# CloudFlare R2 Static Asset Setup
# Simple script to upload static assets to CloudFlare R2

echo "🏀 Setting up CloudFlare R2 for Static Assets..."

# Check if wrangler is available
if [ -f "node_modules/.bin/wrangler" ]; then
    WRANGLER="./node_modules/.bin/wrangler"
elif command -v wrangler &> /dev/null; then
    WRANGLER="wrangler"
else
    echo "❌ Wrangler not found. Run: npm install wrangler"
    exit 1
fi

# Ensure user is logged in
echo "🔐 Checking CloudFlare authentication..."
if ! $WRANGLER whoami &> /dev/null; then
    echo "❌ Please login to CloudFlare first:"
    echo "Run: $WRANGLER login"
    exit 1
fi

# Create R2 bucket for static assets (if not exists)
echo "🪣 Creating R2 bucket for static assets..."
$WRANGLER r2 bucket create ripcity-static-assets 2>/dev/null || echo "Bucket already exists"

# Check if React build exists
REACT_BUILD_PATH="../rip-city-tickets-react/build"
if [ ! -d "$REACT_BUILD_PATH" ]; then
    echo "❌ React build not found at $REACT_BUILD_PATH"
    echo "Please build your React app first:"
    echo "cd ../rip-city-tickets-react && npm run build"
    exit 1
fi

# Upload static assets to R2
echo "📦 Uploading static assets to CloudFlare R2..."

# Upload CSS files
if [ -d "$REACT_BUILD_PATH/static/css" ]; then
    for file in "$REACT_BUILD_PATH/static/css"/*.css; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "  Uploading CSS: $filename"
            $WRANGLER r2 object put "ripcity-static-assets/css/$filename" --file "$file" --content-type "text/css"
        fi
    done
fi

# Upload JS files
if [ -d "$REACT_BUILD_PATH/static/js" ]; then
    for file in "$REACT_BUILD_PATH/static/js"/*.js; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "  Uploading JS: $filename"
            $WRANGLER r2 object put "ripcity-static-assets/js/$filename" --file "$file" --content-type "application/javascript"
        fi
    done
fi

# Upload media files
if [ -d "$REACT_BUILD_PATH/static/media" ]; then
    for file in "$REACT_BUILD_PATH/static/media"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "  Uploading Media: $filename"
            $WRANGLER r2 object put "ripcity-static-assets/media/$filename" --file "$file"
        fi
    done
fi

# Upload favicon and other root assets
for file in "$REACT_BUILD_PATH"/*.{ico,png,jpg,svg,json,txt}; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "  Uploading Root Asset: $filename"
        $WRANGLER r2 object put "ripcity-static-assets/$filename" --file "$file"
    fi
done

echo ""
echo "✅ Static assets uploaded to CloudFlare R2!"
echo ""
echo "📋 Next steps:"
echo "1. Configure CloudFlare Page Rules in dashboard:"
echo "   - ripcityticketdispatch.works/assets/* → Cache Everything (1 month)"
echo "   - ripcityticketdispatch.works/api/* → Bypass Cache"
echo ""
echo "2. Update your React app to use CDN URLs:"
echo "   const ASSET_BASE_URL = 'https://ripcityticketdispatch.works/assets';"
echo ""
echo "3. Test CDN delivery:"
echo "   curl -I https://ripcityticketdispatch.works/assets/css/main.css"
echo ""
echo "💰 Estimated cost: ~$0.15/month for 10GB storage"
