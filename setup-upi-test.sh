#!/bin/bash

# LendIt UPI Payment Test Setup Script
echo "🚀 Setting up LendIt for UPI payment testing..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local with test configuration..."
    cat > .env.local << 'EOF'
# LendIt Payment Test Environment
# These are Razorpay test keys for sandbox testing only

# Razorpay Test Keys (replace with your own from dashboard.razorpay.com)
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET_HERE

# UPI Test Configuration
VITE_UPI_VPA=test@razorpay
VITE_UPI_MERCHANT_NAME=LendIt Test Platform

# Supabase Configuration (add your actual values)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
EOF
    echo "✅ .env.local created with test configuration"
else
    echo "⚠️  .env.local already exists - please check your configuration"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Get your Razorpay test keys from: https://dashboard.razorpay.com"
echo "2. Replace YOUR_TEST_SECRET_HERE in .env.local with your actual secret"
echo "3. Add your Supabase configuration to .env.local"
echo "4. Run: npm run dev"
echo "5. Visit: http://localhost:5173/payment-test"
echo ""
echo "📚 For detailed instructions, see: UPI_TEST_GUIDE.md"
echo ""
echo "🔧 Test Payment Features:"
echo "   • UPI payments via Razorpay"
echo "   • Credit/Debit card payments"
echo "   • Wallet payments"
echo "   • Direct UPI app integration"
echo "   • Payment verification"
echo "   • Transaction recording"
echo ""
echo "Happy testing! 🎉"
