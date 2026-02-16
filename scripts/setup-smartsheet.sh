#!/bin/bash
# EDMECA Academy - Smartsheet Integration Setup Script

echo "🚀 Setting up EDMECA Smartsheet Integration..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo ""
    echo "SMARTSHEET_API_TOKEN=your-api-token-here" >> .env
    echo "SMARTSHEET_SHEET_ID=your-sheet-id-here" >> .env  
    echo "SMARTSHEET_AUTO_TRACK_COMMITS=true" >> .env
    echo ""
    echo "⚠️  Please update .env with your Smartsheet credentials:"
    echo "   1. Get API token from: https://app.smartsheet.com → Account → API Access"
    echo "   2. Get Sheet ID from your SDLC tracker URL"
fi

# Install required dependencies
echo "📦 Installing dependencies..."
npm install axios dotenv chokidar --save

# Make git hooks executable
if [ -f .git/hooks/post-commit ]; then
    echo "🔧 Making git hooks executable..."
    chmod +x .git/hooks/post-commit
    chmod +x .git/hooks/post-receive 2>/dev/null || echo "   (post-receive hook not found - will create when needed)"
fi

# Make scripts executable  
echo "🔧 Making scripts executable..."
chmod +x scripts/smartsheet-cli.js 2>/dev/null || echo "   (smartsheet-cli.js will be created)"
chmod +x scripts/smartsheet-watcher.js 2>/dev/null || echo "   (smartsheet-watcher.js will be created)"

# Test configuration
echo ""
echo "🧪 Testing Smartsheet connection..."

if [ -f scripts/smartsheet-cli.js ]; then
    node scripts/smartsheet-cli.js sheet 2>/dev/null && echo "✅ Smartsheet connection successful!" || echo "⚠️  Please configure your API credentials in .env"
else
    echo "⚠️  Smartsheet CLI not found - will be available after setup"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Configure credentials in .env file"
echo "2. Start file watcher: npm run watch:smartsheet"  
echo "3. Use code markers: /* COMPLETE: 1.1 */ to update tasks"
echo "4. Commit with task references: git commit -m 'feat: login (1.1)'"
echo ""
echo "📚 See docs/REALTIME_SMARTSHEET_GUIDE.md for full usage guide"
echo "🎯 Available commands:"
echo "   npm run task:complete 1.1"
echo "   npm run task:status 1.2 'In Progress'"
echo "   npm run task:sync"
echo ""