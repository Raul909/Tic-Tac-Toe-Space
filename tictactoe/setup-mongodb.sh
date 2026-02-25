#!/bin/bash

echo "🗄️  MongoDB Integration Script"
echo "=============================="
echo ""

# Check if mongoose is installed
if ! npm list mongoose &>/dev/null; then
    echo "📦 Installing mongoose..."
    npm install mongoose
else
    echo "✅ Mongoose already installed"
fi

echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy your MongoDB connection string from Atlas"
echo "2. Create .env file:"
echo "   cp .env.example .env"
echo ""
echo "3. Edit .env and add your connection string:"
echo "   MONGODB_URI=mongodb+srv://tictactoe_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tictactoe?retryWrites=true&w=majority"
echo ""
echo "4. Update server.js with MongoDB code from MONGODB_SETUP.md"
echo ""
echo "5. Test locally:"
echo "   npm start"
echo ""
echo "6. Add MONGODB_URI to Render:"
echo "   Dashboard → Environment → Add Variable"
echo ""
echo "7. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add MongoDB integration'"
echo "   git push"
echo ""
echo "✅ Done! Your app will use MongoDB on next deploy."
echo ""
